"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactContact = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ContactContact extends sequelize_1.Model {
}
exports.ContactContact = ContactContact;
ContactContact.init({
    contactId: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'contacts',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    relatedContactId: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'contacts',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'contact_contacts',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['contactId', 'relatedContactId'],
        },
    ],
});
exports.default = ContactContact;
