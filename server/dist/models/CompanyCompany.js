"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyCompany = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class CompanyCompany extends sequelize_1.Model {
}
exports.CompanyCompany = CompanyCompany;
CompanyCompany.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    companyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    relatedCompanyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'company_companies',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['companyId', 'relatedCompanyId'],
        },
    ],
});
exports.default = CompanyCompany;
