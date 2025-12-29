import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface CompanyAttributes {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  type?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  ruc?: string;
  idClienteEmpresa?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  linkedin?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
  description?: string;
  ownerId?: number | null;
  lifecycleStage: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
  tags?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'domain' | 'industry' | 'type' | 'phone' | 'phone2' | 'phone3' | 'ruc' | 'address' | 'city' | 'state' | 'country' | 'postalCode' | 'website' | 'linkedin' | 'numberOfEmployees' | 'annualRevenue' | 'description' | 'ownerId' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public name!: string;
  public domain?: string;
  public industry?: string;
  public type?: string;
  public phone?: string;
  public phone2?: string;
  public phone3?: string;
  public ruc?: string;
  public idClienteEmpresa?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public postalCode?: string;
  public website?: string;
  public linkedin?: string;
  public numberOfEmployees?: number;
  public annualRevenue?: number;
  public description?: string;
  public ownerId?: number | null;
  public lifecycleStage!: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
  public tags?: string[];
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Owner?: User;
}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ruc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idClienteEmpresa: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numberOfEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    annualRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lifecycleStage: {
      type: DataTypes.ENUM('lead', 'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado', 'cierre_perdido', 'firma_contrato', 'activo', 'cliente_perdido', 'lead_inactivo'),
      defaultValue: 'lead',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'companies',
    timestamps: true,
    // Hacer que Sequelize ignore campos que no existen en la base de datos
    omitNull: false,
  }
);

Company.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });

// Relación muchos-a-muchos con contactos se inicializa en models/index.ts después de que todos los modelos estén cargados





