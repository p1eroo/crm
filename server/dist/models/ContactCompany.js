"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactCompany = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ContactCompany extends sequelize_1.Model {
}
exports.ContactCompany = ContactCompany;
ContactCompany.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    contactId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contacts',
            key: 'id',
        },
        onDelete: 'CASCADE',
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
}, {
    sequelize: database_1.sequelize,
    tableName: 'contact_companies',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['contactId', 'companyId'],
        },
    ],
});
exports.default = ContactCompany;
