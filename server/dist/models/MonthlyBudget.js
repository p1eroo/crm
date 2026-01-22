"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyBudget = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class MonthlyBudget extends sequelize_1.Model {
}
exports.MonthlyBudget = MonthlyBudget;
MonthlyBudget.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    month: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 11,
        },
    },
    year: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'monthly_budgets',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['month', 'year'],
        },
    ],
});
