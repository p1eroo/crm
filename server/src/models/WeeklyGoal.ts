import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface WeeklyGoalAttributes {
  id: number;
  year: number;
  week: number; // 1-53 (semana ISO)
  objetivo: number; // Objetivo semanal en soles
  facturacionOverride: number | null; // Override manual de facturación (null = usar calculado)
  createdAt?: Date;
  updatedAt?: Date;
}

interface WeeklyGoalCreationAttributes extends Optional<WeeklyGoalAttributes, 'id' | 'facturacionOverride' | 'createdAt' | 'updatedAt'> {}

export class WeeklyGoal extends Model<WeeklyGoalAttributes, WeeklyGoalCreationAttributes> implements WeeklyGoalAttributes {
  public id!: number;
  public year!: number;
  public week!: number;
  public objetivo!: number;
  public facturacionOverride!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WeeklyGoal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 53,
      },
    },
    objetivo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    facturacionOverride: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'weekly_goals',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['year', 'week'],
      },
    ],
  }
);
