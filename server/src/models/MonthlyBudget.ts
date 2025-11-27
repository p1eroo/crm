import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MonthlyBudgetAttributes {
  id: number;
  month: number; // 0-11 (0 = Enero, 11 = Diciembre)
  year: number;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MonthlyBudgetCreationAttributes extends Optional<MonthlyBudgetAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MonthlyBudget extends Model<MonthlyBudgetAttributes, MonthlyBudgetCreationAttributes> implements MonthlyBudgetAttributes {
  public id!: number;
  public month!: number;
  public year!: number;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MonthlyBudget.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 11,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'monthly_budgets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['month', 'year'],
      },
    ],
  }
);

