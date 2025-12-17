"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealContact = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class DealContact extends sequelize_1.Model {
}
exports.DealContact = DealContact;
DealContact.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dealId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'deals',
            key: 'id',
        },
        onDelete: 'CASCADE',
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
}, {
    sequelize: database_1.sequelize,
    tableName: 'deal_contacts',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['dealId', 'contactId'],
        },
    ],
});
exports.default = DealContact;
