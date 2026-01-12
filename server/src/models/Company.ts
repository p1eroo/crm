import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface CompanyAttributes {
  id: number;
  name: string;
  domain?: string;
  companyname?: string;
  phone?: string;
  email?: string;
  leadSource?: string;
  ruc?: string;
  idClienteEmpresa?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin?: string;
  numberOfEmployees?: number;
  ownerId?: number | null;
  estimatedRevenue?: number;
  isRecoveredClient?: boolean;
  lifecycleStage: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'domain' | 'companyname' | 'phone' | 'email' | 'leadSource' | 'ruc' | 'address' | 'city' | 'state' | 'country' | 'linkedin' | 'numberOfEmployees' | 'ownerId' | 'estimatedRevenue' | 'isRecoveredClient' | 'createdAt' | 'updatedAt'> {}

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public name!: string;
  public domain?: string;
  public companyname?: string;
  public phone?: string;
  public email?: string;
  public leadSource?: string;
  public ruc?: string;
  public idClienteEmpresa?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public linkedin?: string;
  public numberOfEmployees?: number;
  public ownerId?: number | null;
  public estimatedRevenue?: number;
  public isRecoveredClient?: boolean;
  public lifecycleStage!: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
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
    companyname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leadSource: {
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
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numberOfEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estimatedRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    isRecoveredClient: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
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





