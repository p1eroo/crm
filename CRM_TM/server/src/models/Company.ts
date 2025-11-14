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
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
  description?: string;
  ownerId: number;
  lifecycleStage: 'subscriber' | 'lead' | 'marketing qualified lead' | 'sales qualified lead' | 'opportunity' | 'customer' | 'evangelist';
  tags?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'domain' | 'industry' | 'type' | 'phone' | 'address' | 'city' | 'state' | 'country' | 'postalCode' | 'website' | 'numberOfEmployees' | 'annualRevenue' | 'description' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public name!: string;
  public domain?: string;
  public industry?: string;
  public type?: string;
  public phone?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public postalCode?: string;
  public website?: string;
  public numberOfEmployees?: number;
  public annualRevenue?: number;
  public description?: string;
  public ownerId!: number;
  public lifecycleStage!: string;
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lifecycleStage: {
      type: DataTypes.ENUM('subscriber', 'lead', 'marketing qualified lead', 'sales qualified lead', 'opportunity', 'customer', 'evangelist'),
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
  }
);

Company.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });





