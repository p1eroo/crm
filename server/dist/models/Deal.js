"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deal = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
class Deal extends sequelize_1.Model {
}
exports.Deal = Deal;
Deal.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
    stage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    closeDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    probability: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100,
        },
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('baja', 'media', 'alta'),
        allowNull: true,
    },
    ownerId: {
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
    pipelineId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'deals',
    timestamps: true,
});
Deal.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'Owner' });
Deal.belongsTo(Contact_1.Contact, { foreignKey: 'contactId', as: 'Contact' });
Deal.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' });
