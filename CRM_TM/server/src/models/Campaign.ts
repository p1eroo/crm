import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface CampaignAttributes {
  id: number;
  name: string;
  type: 'email' | 'social' | 'advertising' | 'other';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ownerId: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'startDate' | 'endDate' | 'budget' | 'spent' | 'impressions' | 'clicks' | 'conversions' | 'description' | 'createdAt' | 'updatedAt'> {}

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: number;
  public name!: string;
  public type!: string;
  public status!: string;
  public startDate?: Date;
  public endDate?: Date;
  public budget?: number;
  public spent?: number;
  public impressions?: number;
  public clicks?: number;
  public conversions?: number;
  public ownerId!: number;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Owner?: User;
}

Campaign.init(
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
    type: {
      type: DataTypes.ENUM('email', 'social', 'advertising', 'other'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
      defaultValue: 'draft',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    spent: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    impressions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'campaigns',
    timestamps: true,
  }
);

Campaign.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });





