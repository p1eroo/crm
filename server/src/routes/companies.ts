import express from 'express';
import { Op } from 'sequelize';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRoleBasedDataFilter, canModifyResource, canDeleteResource } from '../utils/rolePermissions';
import { logSystemAction, SystemActions, EntityTypes } from '../utils/systemLogger';
import { sequelize } from '../config/database';
import { getPresignedGetUrl } from '../config/minio';

const router = express.Router();
router.use(authenticateToken);

// Función para limpiar empresas eliminando campos null y objetos relacionados null
const cleanCompany = (company: any, includeSensitive: boolean = false): any => {
  const companyData = company.toJSON ? company.toJSON() : company;
  const cleaned: any = {
    id: companyData.id,
    name: companyData.name || '',
    lifecycleStage: companyData.lifecycleStage || 'lead',
    createdAt: companyData.createdAt,
    updatedAt: companyData.updatedAt,
  };

  // Solo incluir campos opcionales si no son null
  if (companyData.domain != null) cleaned.domain = companyData.domain;
  if (companyData.companyname != null) cleaned.companyname = companyData.companyname;
  if (companyData.phone != null) cleaned.phone = companyData.phone;
  if (companyData.email != null) cleaned.email = companyData.email; // Incluir email siempre
  if (companyData.leadSource != null) cleaned.leadSource = companyData.leadSource;
  if (companyData.rubro != null) cleaned.rubro = companyData.rubro;
  if (companyData.companyType != null) cleaned.companyType = companyData.companyType;
  if (companyData.city != null) cleaned.city = companyData.city;
  if (companyData.state != null) cleaned.state = companyData.state;
  if (companyData.country != null) cleaned.country = companyData.country;
  if (companyData.estimatedRevenue != null) cleaned.estimatedRevenue = companyData.estimatedRevenue;
  if (companyData.isRecoveredClient != null) cleaned.isRecoveredClient = companyData.isRecoveredClient;
  if (companyData.ownerId != null) cleaned.ownerId = companyData.ownerId;
  if (companyData.linkedin != null) cleaned.linkedin = companyData.linkedin;
  if (companyData.numberOfEmployees != null) cleaned.numberOfEmployees = companyData.numberOfEmployees;
  if (companyData.dealName != null) cleaned.dealName = companyData.dealName;
  if (companyData.dealCloseDate != null) cleaned.dealCloseDate = companyData.dealCloseDate;
  if (companyData.logo != null) cleaned.logo = companyData.logo; // key en Minio; se reemplaza por URL presigned al responder

  // Solo incluir datos sensibles si se solicita explícitamente (para detalle completo)
  if (includeSensitive) {
  if (companyData.ruc != null) cleaned.ruc = companyData.ruc;
  if (companyData.address != null) cleaned.address = companyData.address;
    if (companyData.idClienteEmpresa != null) cleaned.idClienteEmpresa = companyData.idClienteEmpresa;
  }

  // Solo incluir relaciones si existen
  if (companyData.Owner) {
    cleaned.Owner = {
      id: companyData.Owner.id,
      firstName: companyData.Owner.firstName || '',
      lastName: companyData.Owner.lastName || '',
    };
    // Solo incluir email del Owner si se solicita explícitamente
    if (includeSensitive && companyData.Owner.email) {
      cleaned.Owner.email = companyData.Owner.email;
    }
  }
  if (companyData.Contacts && Array.isArray(companyData.Contacts) && companyData.Contacts.length > 0) {
    cleaned.Contacts = companyData.Contacts;
  }
  
  // Incluir empresas relacionadas si existen
  if (companyData.Companies && Array.isArray(companyData.Companies) && companyData.Companies.length > 0) {
    cleaned.Companies = companyData.Companies;
  }

  return cleaned;
};

// Función para transformar empresa para lista (sin datos sensibles)
const transformCompanyForList = (company: any): any => {
  return cleanCompany(company, false);
};

// Si logo es una URL (proxy/media), se deja tal cual. Si es key de MinIO, se reemplaza por URL presigned.
async function withPresignedLogo(cleaned: any): Promise<any> {
  if (!cleaned.logo || typeof cleaned.logo !== 'string') return cleaned;
  if (cleaned.logo.startsWith('http://') || cleaned.logo.startsWith('https://')) return cleaned;
  try {
    const url = await getPresignedGetUrl(cleaned.logo);
    cleaned.logo = url || null;
  } catch {
    cleaned.logo = null;
  }
  return cleaned;
}

// Función para extraer el dominio del email si no está definido
const extractDomainFromEmail = (companyData: any): void => {
  // Solo extraer dominio si no está definido y hay un email válido
  if (!companyData.domain && companyData.email && typeof companyData.email === 'string') {
    const emailMatch = companyData.email.match(/@(.+)/);
    if (emailMatch && emailMatch[1]) {
      companyData.domain = emailMatch[1].toLowerCase().trim();
    }
  }
};

// Obtener todas las empresas
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Validar que el usuario esté autenticado
    if (!req.userId) {
      console.error('[ERROR] req.userId es undefined en GET /companies');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!req.userRole) {
      console.error('[ERROR] req.userRole es undefined en GET /companies para userId:', req.userId);
      // No retornar error aquí, solo loguear - el middleware debería haber establecido el rol
    }
    
    // El middleware authenticateToken ya establece req.userRole correctamente
    // No necesitamos código adicional aquí, igual que en contacts.ts y deals.ts
    
    const { 
      page = 1, 
      limit: limitParam = 50, 
      search, 
      lifecycleStage, 
      ownerId, 
      companyname,
      // Nuevos parámetros de filtro
      stages, // Array de etapas: ["lead", "activo"]
      countries, // Array de países: ["Perú", "Chile"]
      owners, // Array: ["me", "unassigned", "1", "2"]
      sortBy = 'newest', // newest, oldest, name, nameDesc
      // Filtros por columna
      filterNombre,
      filterPropietario,
      filterTelefono,
      filterCorreo,
      filterOrigenLead,
      filterEtapa,
      filterCR,
      // Filtros avanzados (JSON string)
      filterRules,
    } = req.query;
    
    // Limitar el tamaño máximo de página para evitar sobrecarga
    const maxLimit = 100;
    const requestedLimit = Number(limitParam);
    const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
    const pageNum = Number(page) < 1 ? 1 : Number(page);
    const offset = (pageNum - 1) * limit;

    // Aplicar filtro RBAC primero (igual que en contacts y deals)
    const roleFilter = getRoleBasedDataFilter(req.userRole, req.userId);
    
    // Construir el objeto where empezando con el filtro RBAC
    const where: any = {};
    Object.assign(where, roleFilter);
    
    // Búsqueda general
    if (search) {
      const searchStr = typeof search === 'string' ? search : String(search);
      const searchConditions = [
        { name: { [Op.iLike]: `%${searchStr}%` } },
        { domain: { [Op.iLike]: `%${searchStr}%` } },
        { companyname: { [Op.iLike]: `%${searchStr}%` } },
      ];
      
      // Si ya hay un filtro ownerId (filtro RBAC), combinarlo con AND
      if (where.ownerId) {
        where[Op.and] = [
          { ownerId: where.ownerId },
          { [Op.or]: searchConditions }
        ];
        delete where.ownerId; // Eliminar el ownerId del nivel superior
      } else {
        where[Op.or] = searchConditions;
      }
    }
    
    // Helper function para agregar condiciones al where (maneja Op.and si existe)
    const addCondition = (condition: any) => {
      if (where[Op.and]) {
        where[Op.and].push(condition);
      } else {
        Object.assign(where, condition);
      }
    };
    
    // Filtro por etapas (lifecycleStage) - soporta múltiples valores
    if (lifecycleStage) {
      addCondition({ lifecycleStage });
    } else if (stages) {
      const stagesArray = Array.isArray(stages) ? stages : [stages];
      if (stagesArray.length > 0) {
        addCondition({ lifecycleStage: { [Op.in]: stagesArray } });
      }
    }
    
    // Filtro por países
    if (countries) {
      const countriesArray = Array.isArray(countries) ? countries : [countries];
      if (countriesArray.length > 0) {
        addCondition({ country: { [Op.in]: countriesArray } });
      }
    }
    
    // Filtro por propietarios (solo para admin y jefe_comercial)
    // Si el usuario NO es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
    if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && owners) {
      const ownersArray = Array.isArray(owners) ? owners : [owners];
      const ownerIds: (number | null)[] = [];
      const hasUnassigned = ownersArray.includes('unassigned');
      const hasMe = ownersArray.includes('me');
      
      ownersArray.forEach((owner: string | any) => {
        const ownerStr = String(owner);
        if (ownerStr === 'unassigned') {
          // Se manejará después
        } else if (ownerStr === 'me') {
          if (req.userId) ownerIds.push(req.userId);
        } else if (!isNaN(Number(ownerStr))) {
          ownerIds.push(Number(ownerStr));
        }
      });
      
      let newOwnerFilter: any;
      if (hasUnassigned && ownerIds.length > 0) {
        newOwnerFilter = { [Op.or]: [{ [Op.in]: ownerIds }, { [Op.is]: null }] };
      } else if (hasUnassigned) {
        newOwnerFilter = { [Op.is]: null };
      } else if (hasMe && ownerIds.length > 1) {
        newOwnerFilter = { [Op.in]: ownerIds };
      } else if (hasMe) {
        newOwnerFilter = req.userId || null;
      } else if (ownerIds.length > 0) {
        newOwnerFilter = { [Op.in]: ownerIds };
      }
      
      if (newOwnerFilter !== undefined) {
        // Si hay Op.and, necesitamos reemplazar el ownerId dentro del Op.and
        if (where[Op.and]) {
          // Buscar y reemplazar el ownerId en el array Op.and
          const ownerIndex = where[Op.and].findIndex((cond: any) => cond.ownerId !== undefined);
          if (ownerIndex !== -1) {
            where[Op.and][ownerIndex] = { ownerId: newOwnerFilter };
          } else {
            where[Op.and].push({ ownerId: newOwnerFilter });
          }
        } else {
          where.ownerId = newOwnerFilter;
        }
      }
    } else if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && ownerId) {
      // Compatibilidad con el filtro antiguo (solo para admin y jefe_comercial)
      const newOwnerFilter = ownerId === 'me' ? req.userId : ownerId;
      if (where[Op.and]) {
        const ownerIndex = where[Op.and].findIndex((cond: any) => cond.ownerId !== undefined);
        if (ownerIndex !== -1) {
          where[Op.and][ownerIndex] = { ownerId: newOwnerFilter };
        } else {
          where[Op.and].push({ ownerId: newOwnerFilter });
        }
      } else {
        where.ownerId = newOwnerFilter;
      }
    }
    // Si no es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
    
    // Filtro por propietario (búsqueda por nombre) - DEBE IR ANTES DE LA PAGINACIÓN
    if (filterPropietario) {
      const filterPropietarioStr = String(filterPropietario).trim();
      if (filterPropietarioStr) {
        try {
          // Buscar usuarios que coincidan con el texto del filtro
          const matchingUsers = await User.findAll({
            where: {
              [Op.or]: [
                { firstName: { [Op.iLike]: `%${filterPropietarioStr}%` } },
                { lastName: { [Op.iLike]: `%${filterPropietarioStr}%` } },
                sequelize.where(
                  sequelize.fn('CONCAT', 
                    sequelize.col('firstName'), 
                    ' ', 
                    sequelize.col('lastName')
                  ),
                  { [Op.iLike]: `%${filterPropietarioStr}%` }
                )
              ]
            },
            attributes: ['id']
          });
          
          const ownerIds = matchingUsers.map(user => user.id);
          
          if (ownerIds.length > 0) {
            // Aplicar el filtro ANTES de la paginación
            // Si hay Op.and, necesitamos agregar el filtro dentro del Op.and
            if (where[Op.and]) {
              // Buscar si ya existe un filtro ownerId en Op.and
              const ownerIndex = where[Op.and].findIndex((cond: any) => cond.ownerId !== undefined);
              if (ownerIndex !== -1) {
                // Si ya existe, combinarlo con AND usando Op.in
                const existingOwnerFilter = where[Op.and][ownerIndex].ownerId;
                if (existingOwnerFilter && existingOwnerFilter[Op.in]) {
                  // Combinar los arrays de IDs (intersección)
                  const existingIds = existingOwnerFilter[Op.in];
                  const combinedIds = existingIds.filter((id: number) => ownerIds.includes(id));
                  where[Op.and][ownerIndex] = { ownerId: { [Op.in]: combinedIds.length > 0 ? combinedIds : [-1] } };
                } else {
                  where[Op.and][ownerIndex] = { ownerId: { [Op.in]: ownerIds } };
                }
              } else {
                where[Op.and].push({ ownerId: { [Op.in]: ownerIds } });
              }
            } else if (where.ownerId) {
              // Si ya hay un ownerId en el nivel superior, hacer intersección
              const existingOwnerFilter = where.ownerId;
              if (existingOwnerFilter && existingOwnerFilter[Op.in]) {
                const existingIds = existingOwnerFilter[Op.in];
                const combinedIds = existingIds.filter((id: number) => ownerIds.includes(id));
                where.ownerId = { [Op.in]: combinedIds.length > 0 ? combinedIds : [-1] };
              } else {
                where.ownerId = { [Op.in]: ownerIds };
              }
            } else {
              where.ownerId = { [Op.in]: ownerIds };
            }
          } else {
            // Si no hay usuarios que coincidan, filtrar para que no haya resultados
            where.ownerId = { [Op.in]: [-1] }; // ID que no existe = ningún resultado
          }
        } catch (error) {
          console.warn('[WARN] Error al buscar usuarios para filterPropietario:', error);
        }
      }
    }
    
    // Filtros por columna
    if (companyname) {
      addCondition({ companyname });
    }
    
    if (filterNombre) {
      addCondition({ name: { [Op.iLike]: `%${filterNombre}%` } });
    }
    
    if (filterTelefono) {
      addCondition({ phone: { [Op.iLike]: `%${filterTelefono}%` } });
    }
    
    if (filterCorreo) {
      addCondition({ email: { [Op.iLike]: `%${filterCorreo}%` } });
    }
    
    if (filterOrigenLead) {
      addCondition({ leadSource: { [Op.iLike]: `%${filterOrigenLead}%` } });
    }
    
    if (filterEtapa) {
      addCondition({ lifecycleStage: { [Op.iLike]: `%${filterEtapa}%` } });
    }
    
    if (filterCR !== undefined) {
      const filterCRValue = String(filterCR).toLowerCase().trim();
      const buscaSi = ['sí', 'si', 'yes', 's', '1', 'x', '✓', 'true'].includes(filterCRValue);
      const buscaNo = ['no', 'not', '0', 'false', 'n'].includes(filterCRValue);
      
      if (buscaSi) {
        addCondition({ isRecoveredClient: true });
      } else if (buscaNo) {
        addCondition({ isRecoveredClient: false });
      }
    }
    
    // Filtros avanzados (reglas)
    let parsedFilterRules: any[] = [];
    if (filterRules) {
      try {
        parsedFilterRules = typeof filterRules === 'string' 
          ? JSON.parse(filterRules) 
          : filterRules;
      } catch (e) {
        console.warn('Error parsing filterRules:', e);
      }
    }
    
    // Aplicar filtros avanzados
    parsedFilterRules.forEach((rule: any) => {
      if (!rule.value || !rule.column || !rule.operator) return;
      
      let condition: any = {};
      switch (rule.column) {
        case 'name':
          if (rule.operator === 'contains') {
            condition = { name: { [Op.iLike]: `%${rule.value}%` } };
          } else if (rule.operator === 'equals') {
            condition = { name: { [Op.iLike]: rule.value } };
          } else if (rule.operator === 'startsWith') {
            condition = { name: { [Op.iLike]: `${rule.value}%` } };
          } else if (rule.operator === 'endsWith') {
            condition = { name: { [Op.iLike]: `%${rule.value}` } };
          } else if (rule.operator === 'notEquals') {
            condition = { name: { [Op.notILike]: rule.value } };
          }
          break;
        case 'companyname':
          if (rule.operator === 'contains') {
            condition = { companyname: { [Op.iLike]: `%${rule.value}%` } };
          } else if (rule.operator === 'equals') {
            condition = { companyname: { [Op.iLike]: rule.value } };
          }
          break;
        case 'phone':
          if (rule.operator === 'contains') {
            condition = { phone: { [Op.iLike]: `%${rule.value}%` } };
          }
          break;
        case 'leadSource':
          if (rule.operator === 'contains') {
            condition = { leadSource: { [Op.iLike]: `%${rule.value}%` } };
          }
          break;
        case 'country':
          if (rule.operator === 'contains') {
            condition = { country: { [Op.iLike]: `%${rule.value}%` } };
          }
          break;
        case 'lifecycleStage':
          if (rule.operator === 'equals') {
            condition = { lifecycleStage: rule.value };
          }
          break;
      }
      
      if (Object.keys(condition).length > 0) {
        addCondition(condition);
      }
    });
    
    // Ordenamiento
    let order: [string, string][] = [['createdAt', 'DESC']];
    switch (sortBy) {
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'nameDesc':
        order = [['name', 'DESC']];
        break;
    }

    
    // Intentar obtener companies con la relación Owner
    let companies;
    try {
      companies = await Company.findAndCountAll({
        where,
        include: [
          { 
            model: User, 
            as: 'Owner', 
            attributes: ['id', 'firstName', 'lastName'], // NO incluir email del Owner
            required: false 
          },
        ],
        limit,
        offset,
        order,
        distinct: true, // Importante para contar correctamente con includes
      });
    } catch (includeError: any) {
      console.error('[ERROR] Error en Company.findAndCountAll:', includeError);
      console.error('[ERROR] Stack:', includeError.stack);
      console.error('[ERROR] Message:', includeError.message);
      // Si falla por problemas con la relación Owner, intentar sin el include
      console.warn('⚠️ Error con relación Owner, intentando sin include:', includeError.message);
      companies = await Company.findAndCountAll({
        where,
        limit,
        offset,
        order,
      });
      
      // Agregar Owner manualmente solo para los que tienen ownerId válido
      const companiesWithOwner = await Promise.all(
        companies.rows.map(async (company: any) => {
          const companyData = company.toJSON();
          if (companyData.ownerId) {
            try {
              const owner = await User.findByPk(companyData.ownerId, {
                attributes: ['id', 'firstName', 'lastName'], // NO incluir email
              });
              companyData.Owner = owner ? owner.toJSON() : null;
            } catch (ownerError) {
              console.warn(`⚠️ No se pudo obtener Owner para company ${companyData.id}:`, ownerError);
              companyData.Owner = null;
            }
          } else {
            companyData.Owner = null;
          }
          return transformCompanyForList(companyData);
        })
      );
      const withLogos = await Promise.all(companiesWithOwner.map(withPresignedLogo));
      return res.json({
        companies: withLogos,
        total: companies.count,
        page: pageNum,
        limit,
        totalPages: Math.ceil(companies.count / limit),
      });
    }

    // Transformar empresas para filtrar datos sensibles
    const transformedCompanies = companies.rows.map(transformCompanyForList);
    const withLogos = await Promise.all(transformedCompanies.map(withPresignedLogo));

    res.json({
      companies: withLogos,
      total: companies.count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(companies.count / limit),
    });
  } catch (error: any) {
    console.error('❌ Error completo al obtener empresas:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error original:', error.original);
    if (error.errors) {
      console.error('❌ Error errors:', error.errors);
    }
    
    // No exponer detalles del error en producción
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error al obtener empresas';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtener estadísticas de empresas inactivas (sin contacto en últimos 5 días)
router.get('/inactivity-stats', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Aplicar filtro RBAC
    const roleFilter = getRoleBasedDataFilter(req.userRole, req.userId);
    
    // Calcular fecha límite (hace 5 días)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    // Obtener todas las empresas según permisos
    const allCompanies = await Company.findAll({
      where: roleFilter,
      attributes: ['id'],
    });

    const companyIds = allCompanies.map(c => c.id);

    if (companyIds.length === 0) {
      return res.json({ inactiveCount: 0 });
    }

    // Obtener empresas que SÍ han tenido contacto en los últimos 5 días
    // Contacto = tarea creada, reunión creada (tarea tipo 'meeting'), o email enviado (actividad tipo 'email')
    
    // 1. Tareas relacionadas con empresas (incluyendo reuniones)
    const recentTasks = await Task.findAll({
      where: {
        companyId: { [Op.in]: companyIds },
        createdAt: { [Op.gte]: fiveDaysAgo },
      },
      attributes: ['companyId'],
    });

    // 2. Actividades tipo email relacionadas con empresas
    const recentEmails = await Activity.findAll({
      where: {
        companyId: { [Op.in]: companyIds },
        type: 'email',
        createdAt: { [Op.gte]: fiveDaysAgo },
      },
      attributes: ['companyId'],
    });

    // Empresas que han tenido contacto (obtener IDs únicos)
    const companiesWithContact = new Set([
      ...recentTasks.map((t: any) => {
        const taskData = t.toJSON ? t.toJSON() : t;
        return taskData.companyId;
      }).filter((id: any): id is number => id != null),
      ...recentEmails.map((a: any) => {
        const activityData = a.toJSON ? a.toJSON() : a;
        return activityData.companyId;
      }).filter((id: any): id is number => id != null),
    ]);

    // Empresas sin contacto = total - empresas con contacto
    const inactiveCount = companyIds.length - companiesWithContact.size;

    res.json({ inactiveCount });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de inactividad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener lista de empresas inactivas con paginación
router.get('/inactive', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { page = 1, limit: limitParam = 20 } = req.query;
    const limit = Number(limitParam) < 1 ? 20 : Number(limitParam);
    const pageNum = Number(page) < 1 ? 1 : Number(page);
    const offset = (pageNum - 1) * limit;

    // Aplicar filtro RBAC
    const roleFilter = getRoleBasedDataFilter(req.userRole, req.userId);
    
    // Calcular fecha límite (hace 5 días)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    // Obtener todas las empresas según permisos
    const allCompanies = await Company.findAll({
      where: roleFilter,
      attributes: ['id'],
    });

    const companyIds = allCompanies.map(c => c.id);

    if (companyIds.length === 0) {
      return res.json({ 
        companies: [],
        total: 0,
        page: pageNum,
        limit,
        totalPages: 0
      });
    }

    // Obtener empresas que SÍ han tenido contacto en los últimos 5 días
    const recentTasks = await Task.findAll({
      where: {
        companyId: { [Op.in]: companyIds },
        createdAt: { [Op.gte]: fiveDaysAgo },
      },
      attributes: ['companyId'],
    });

    const recentEmails = await Activity.findAll({
      where: {
        companyId: { [Op.in]: companyIds },
        type: 'email',
        createdAt: { [Op.gte]: fiveDaysAgo },
      },
      attributes: ['companyId'],
    });

    // Empresas que han tenido contacto (obtener IDs únicos)
    const companiesWithContact = new Set([
      ...recentTasks.map((t: any) => {
        const taskData = t.toJSON ? t.toJSON() : t;
        return taskData.companyId;
      }).filter((id: any): id is number => id != null),
      ...recentEmails.map((a: any) => {
        const activityData = a.toJSON ? a.toJSON() : a;
        return activityData.companyId;
      }).filter((id: any): id is number => id != null),
    ]);

    // IDs de empresas sin contacto
    const inactiveCompanyIds = companyIds.filter(id => !companiesWithContact.has(id));

    if (inactiveCompanyIds.length === 0) {
      return res.json({ 
        companies: [],
        total: 0,
        page: pageNum,
        limit,
        totalPages: 0
      });
    }

    // Obtener las empresas inactivas con paginación
    const { count, rows } = await Company.findAndCountAll({
      where: {
        id: { [Op.in]: inactiveCompanyIds },
        ...roleFilter,
      },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit,
      offset,
      order: [['name', 'ASC']],
    });

    // Transformar empresas para la respuesta
    const companies = rows.map(company => transformCompanyForList(company));

    res.json({
      companies,
      total: count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error: any) {
    console.error('Error obteniendo empresas inactivas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener una empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }, // Contactos asociados muchos-a-muchos
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] }, // Empresas relacionadas muchos-a-muchos
      ],
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Obtener también los contactos vinculados por companyId (relación uno-a-muchos)
    const contactsByCompanyId = await Contact.findAll({
      where: { companyId: req.params.id },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
    });

    // Combinar ambos tipos de contactos, eliminando duplicados
    const companyData: any = company.toJSON(); // Usar 'any' para permitir propiedades de relaciones
    const manyToManyContacts = companyData.Contacts || [];
    const oneToManyContacts = contactsByCompanyId.map(c => c.toJSON());
    
    // Crear un Map para eliminar duplicados por ID
    const contactsMap = new Map();
    
    // Primero agregar los de muchos-a-muchos
    manyToManyContacts.forEach((contact: any) => {
      contactsMap.set(contact.id, contact);
    });
    
    // Luego agregar los de uno-a-muchos (sobrescribirán si hay duplicados)
    oneToManyContacts.forEach((contact: any) => {
      contactsMap.set(contact.id, contact);
    });
    
    // Convertir el Map a array
    companyData.Contacts = Array.from(contactsMap.values());

    // Nombre y fecha de cierre del primer negocio (Deal) asociado por companyId para el formulario
    const firstDeal = await Deal.findOne({
      where: { companyId: req.params.id },
      order: [['id', 'ASC']],
      attributes: ['name', 'closeDate'],
    });
    companyData.dealName = firstDeal?.name ?? undefined;
    companyData.dealCloseDate = firstDeal?.closeDate
      ? new Date(firstDeal.closeDate).toISOString().slice(0, 10)
      : undefined;

    const cleaned = cleanCompany(companyData, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear empresa
router.post('/', async (req: AuthRequest, res) => {
  try {
    const companyData = {
      ...req.body,
      // Asignar automáticamente el usuario actual como propietario del registro
      ownerId: req.body.ownerId || req.userId || null,
    };

    // Validar que el nombre sea requerido
    if (!companyData.name || !companyData.name.trim()) {
      return res.status(400).json({ 
        error: 'El nombre de la empresa es requerido',
        field: 'name',
      });
    }

    // Validar y convertir estimatedRevenue si viene como string vacío o null
    if (companyData.estimatedRevenue !== undefined) {
      if (companyData.estimatedRevenue === '' || companyData.estimatedRevenue === null) {
        companyData.estimatedRevenue = null;
      } else if (typeof companyData.estimatedRevenue === 'string') {
        const parsed = parseFloat(companyData.estimatedRevenue);
        companyData.estimatedRevenue = isNaN(parsed) ? null : parsed;
      }
    }

    // Extraer dominio del email si no está definido
    extractDomainFromEmail(companyData);

    // Validar que no exista una empresa con el mismo nombre (case-insensitive)
    if (companyData.name) {
      const existingCompanyByName = await Company.findOne({
        where: {
          name: {
            [Op.iLike]: companyData.name.trim(), // Case-insensitive
          },
        },
      });

      if (existingCompanyByName) {
        return res.status(400).json({ 
          error: 'Ya existe una empresa con este nombre',
          duplicateField: 'name',
          existingCompanyId: existingCompanyByName.id,
        });
      }
    }

    // Validar que no exista una empresa con el mismo RUC (si se proporciona)
    if (companyData.ruc && companyData.ruc.trim() !== '') {
      const existingCompanyByRuc = await Company.findOne({
        where: {
          ruc: companyData.ruc.trim(),
        },
      });

      if (existingCompanyByRuc) {
        return res.status(400).json({ 
          error: 'Ya existe una empresa con este RUC',
          duplicateField: 'ruc',
          existingCompanyId: existingCompanyByRuc.id,
        });
      }
    }

    const company = await Company.create(companyData);
    const newCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    // Crear negocio (Deal) asociado con la misma etapa, facturación y propietario (empresa y negocio comparten valores)
    const dealOwnerId = company.ownerId ?? req.userId;
    const dealName = (req.body.dealName != null && String(req.body.dealName).trim() !== '') ? String(req.body.dealName).trim() : company.name;
    const dealCloseDate = req.body.dealCloseDate && String(req.body.dealCloseDate).trim() ? new Date(String(req.body.dealCloseDate).trim()) : null;
    if (dealOwnerId) {
      try {
        await Deal.create({
          name: dealName,
          amount: company.estimatedRevenue != null ? Number(company.estimatedRevenue) : 0,
          stage: company.lifecycleStage || 'lead',
          ownerId: dealOwnerId,
          companyId: company.id,
          pipelineId: 1,
          ...(dealCloseDate && !isNaN(dealCloseDate.getTime()) && { closeDate: dealCloseDate }),
        });
      } catch (dealErr: any) {
        console.error('Error creating deal for company:', dealErr);
        // No fallar la creación de la empresa si falla el negocio
      }
    }

    // Registrar log
    if (req.userId) {
      await logSystemAction(
        req.userId,
        SystemActions.CREATE,
        EntityTypes.COMPANY,
        company.id,
        { name: company.name },
        req
      );
    }

    const cleaned = cleanCompany(newCompany, true);
    await withPresignedLogo(cleaned);
    res.status(201).json(cleaned);
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar empresa
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar permisos: solo el propietario o admin puede modificar
    if (!canModifyResource(req.userRole, req.userId, company.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta empresa' });
    }

    // Preparar los datos para actualizar, manejando campos especiales
    const updateData: any = { ...req.body };
    
    // Validar que el nombre sea requerido si se está actualizando
    if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
      return res.status(400).json({ 
        error: 'El nombre de la empresa es requerido',
        field: 'name',
      });
    }
    
    // Si leadSource viene, asegurarse de que se mapee correctamente
    if (updateData.leadSource !== undefined) {
      updateData.leadSource = updateData.leadSource || null;
    }
    
    // Si estimatedRevenue viene como string vacío o null, convertirlo a null
    if (updateData.estimatedRevenue !== undefined) {
      if (updateData.estimatedRevenue === '' || updateData.estimatedRevenue === null) {
        updateData.estimatedRevenue = null;
      } else if (typeof updateData.estimatedRevenue === 'string') {
        const parsed = parseFloat(updateData.estimatedRevenue);
        updateData.estimatedRevenue = isNaN(parsed) ? null : parsed;
      }
    }
    
    // Si email viene como string vacío, convertirlo a null
    if (updateData.email !== undefined && updateData.email === '') {
      updateData.email = null;
    }

    await company.update(updateData);
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!updatedCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada después de la actualización' });
    }

    // Sincronizar negocio(s) con la empresa: misma etapa, facturación y propietario (la empresa jala los valores del negocio en la UI; aquí los mantenemos alineados)
    const dealOwnerId = updatedCompany.ownerId ?? req.userId;
    const dealName = (req.body.dealName != null && String(req.body.dealName).trim() !== '') ? String(req.body.dealName).trim() : updatedCompany.name;
    const dealCloseDateRaw = req.body.dealCloseDate && String(req.body.dealCloseDate).trim();
    const dealCloseDate = dealCloseDateRaw ? (() => { const d = new Date(dealCloseDateRaw); return !isNaN(d.getTime()) ? d : null; })() : null;
    if (dealOwnerId != null) {
      try {
        const existingDeals = await Deal.findAll({
          where: { companyId: company.id },
          order: [['id', 'ASC']],
          limit: 1,
        });
        const stage = updatedCompany.lifecycleStage || 'lead';
        const amount = updatedCompany.estimatedRevenue != null ? Number(updatedCompany.estimatedRevenue) : 0;
        const dealPayload: { name: string; stage: string; amount: number; ownerId: number; closeDate?: Date } = { name: dealName, stage, amount, ownerId: dealOwnerId };
        if (dealCloseDate != null) dealPayload.closeDate = dealCloseDate;
        if (existingDeals.length > 0) {
          await existingDeals[0].update(dealPayload);
        } else {
          await Deal.create({
            name: dealName,
            amount,
            stage,
            ownerId: dealOwnerId,
            companyId: company.id,
            pipelineId: 1,
            ...(dealCloseDate && { closeDate: dealCloseDate }),
          });
        }
      } catch (dealErr: any) {
        console.error('Error syncing deal for company:', dealErr);
      }
    }

    // Registrar log
    if (req.userId) {
      await logSystemAction(
        req.userId,
        SystemActions.UPDATE,
        EntityTypes.COMPANY,
        company.id,
        { name: updatedCompany.name, changes: updateData },
        req
      );
    }

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error updating company:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ error: error.message });
  }
});

// Guardar URL de logo (el frontend sube el archivo al proxy media y envía la URL aquí)
router.post('/:id/logo', async (req: AuthRequest, res) => {
  try {
    const url = req.body?.url;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Se requiere la URL del logo (campo "url")' });
    }
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    if (!canModifyResource(req.userRole, req.userId, company.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta empresa' });
    }
    await company.update({ logo: url.trim() });
    const updated = await Company.findByPk(company.id, {
      include: [{ model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });
    const cleaned = cleanCompany(updated, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error saving company logo URL:', error);
    res.status(500).json({ error: error.message || 'Error al guardar el logo' });
  }
});

// Eliminar empresa
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar permisos: solo el propietario o admin puede eliminar
    if (!canDeleteResource(req.userRole, req.userId, company.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta empresa' });
    }

    const companyName = company.name;
    await company.destroy();

    // Registrar log
    if (req.userId) {
      await logSystemAction(
        req.userId,
        SystemActions.DELETE,
        EntityTypes.COMPANY,
        parseInt(req.params.id),
        { name: companyName },
        req
      );
    }

    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contactos asociados a una empresa
router.post('/:id/contacts', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: Contact, as: 'Contacts' },
      ],
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de contactIds' });
    }

    // Verificar que todos los contactos existan
    const contacts = await Contact.findAll({
      where: { id: { [Op.in]: contactIds } },
    });

    if (contacts.length !== contactIds.length) {
      return res.status(400).json({ error: 'Uno o más contactos no existen' });
    }

    // Obtener IDs de contactos ya asociados
    const existingContactIds = ((company as any).Contacts || []).map((c: any) => c.id);
    
    // Filtrar solo los contactos nuevos
    const newContactIds = contactIds.filter((id: number) => !existingContactIds.includes(id));

    if (newContactIds.length > 0) {
      // Usar el método add de Sequelize para relaciones muchos-a-muchos
      await (company as any).addContacts(newContactIds);
    }

    // Obtener la empresa actualizada con todos sus contactos
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error adding contacts to company:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar los contactos' });
  }
});

// Eliminar asociación de contacto con empresa
router.delete('/:id/contacts/:contactId', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const contactId = parseInt(req.params.contactId);
    
    // Usar el método remove de Sequelize para relaciones muchos-a-muchos
    await (company as any).removeContacts([contactId]);

    // Obtener la empresa actualizada
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error removing contact association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

// Agregar negocios asociados a una empresa (desde modal "Crear negocio" en detalle de empresa)
router.post('/:id/deals', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{ model: Deal, as: 'Deals', attributes: ['id'] }],
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    if (!canModifyResource(req.userRole, req.userId, company.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta empresa' });
    }

    const { dealIds } = req.body;
    if (!Array.isArray(dealIds) || dealIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de dealIds' });
    }

    const currentDeals = (company as any).Deals || [];
    const currentDealIds = currentDeals.map((d: any) => d.id);
    const newDealIds = dealIds.filter((id: number) => !currentDealIds.includes(id));

    if (newDealIds.length > 0) {
      await (company as any).addDeals(newDealIds);
    }

    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'] },
      ],
    });

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.status(200).json(cleaned);
  } catch (error: any) {
    console.error('Error adding deals to company:', error);
    res.status(500).json({ error: error.message || 'Error al asociar los negocios' });
  }
});

// Agregar empresas asociadas a una empresa
router.post('/:id/companies', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'Companies' },
      ],
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const { companyIds } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de companyIds' });
    }

    // Verificar que todas las empresas existan
    const companies = await Company.findAll({
      where: { id: { [Op.in]: companyIds } },
    });

    if (companies.length !== companyIds.length) {
      return res.status(400).json({ error: 'Una o más empresas no existen' });
    }

    // Obtener IDs de empresas ya asociadas
    const existingCompanyIds = ((company as any).Companies || []).map((c: any) => c.id);
    
    // Filtrar solo las empresas nuevas
    const newCompanyIds = companyIds.filter((id: number) => !existingCompanyIds.includes(id));

    if (newCompanyIds.length > 0) {
      // Usar el método add de Sequelize para relaciones muchos-a-muchos
      await (company as any).addCompanies(newCompanyIds);
    }

    // Obtener la empresa actualizada con todas sus empresas relacionadas
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] },
      ],
    });

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error adding companies to company:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar las empresas' });
  }
});

// Eliminar asociación de empresa con empresa
router.delete('/:id/companies/:companyId', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const relatedCompanyId = parseInt(req.params.companyId);
    
    // Usar el método remove de Sequelize para relaciones muchos-a-muchos
    await (company as any).removeCompanies([relatedCompanyId]);

    // Obtener la empresa actualizada
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] },
      ],
    });

    const cleaned = cleanCompany(updatedCompany, true);
    await withPresignedLogo(cleaned);
    res.json(cleaned);
  } catch (error: any) {
    console.error('Error removing company association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

export default router;





