import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface AutomationAttributes {
  id: number;
  name: string;
  trigger: string;
  conditions?: string;
  actions?: string;
  status: 'active' | 'inactive' | 'draft';
  ownerId: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AutomationCreationAttributes extends Optional<AutomationAttributes, 'id' | 'conditions' | 'actions' | 'description' | 'createdAt' | 'updatedAt'> {}

export class Automation extends Model<AutomationAttributes, AutomationCreationAttributes> implements AutomationAttributes {
  public id!: number;
  public name!: string;
  public trigger!: string;
  public conditions?: string;
  public actions?: string;
  public status!: string;
  public ownerId!: number;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Owner?: User;
}

Automation.init(
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
    trigger: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft'),
      defaultValue: 'draft',
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
    tableName: 'automations',
    timestamps: true,
  }
);

Automation.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });








