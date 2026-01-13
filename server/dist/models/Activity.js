"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
const Deal_1 = require("./Deal");
class Activity extends sequelize_1.Model {
}
exports.Activity = Activity;
Activity.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'),
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    contactId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'contacts',
            key: 'id',
        },
    },
    companyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'companies',
            key: 'id',
        },
    },
    dealId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'deals',
            key: 'id',
        },
    },
    taskId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tasks',
            key: 'id',
        },
    },
    completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'activities',
    timestamps: true,
});
Activity.belongsTo(User_1.User, { foreignKey: 'userId', as: 'User' });
Activity.belongsTo(Contact_1.Contact, { foreignKey: 'contactId', as: 'Contact' });
Activity.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' });
Activity.belongsTo(Deal_1.Deal, { foreignKey: 'dealId', as: 'Deal' });
