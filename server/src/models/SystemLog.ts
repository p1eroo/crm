import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface SystemLogAttributes {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

interface SystemLogCreationAttributes extends Optional<SystemLogAttributes, 'id' | 'createdAt'> {}

export class SystemLog extends Model<SystemLogAttributes, SystemLogCreationAttributes> 
  implements SystemLogAttributes {
  public id!: number;
  public userId!: number;
  public action!: string;
  public entityType!: string;
  public entityId?: number;
  public details?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;

  public User?: User;
}

SystemLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'systemLogs',
    timestamps: true,
    updatedAt: false, // Solo createdAt
  }
);

SystemLog.belongsTo(User, { foreignKey: 'userId', as: 'User' });
