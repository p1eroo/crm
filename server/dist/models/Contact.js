"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Company_1 = require("./Company");
class Contact extends sequelize_1.Model {
}
exports.Contact = Contact;
Contact.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    dni: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    cee: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    mobile: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    jobTitle: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    companyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id',
        },
    },
    ownerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    postalCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    facebook: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    twitter: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    github: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    linkedin: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    youtube: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    lifecycleStage: {
        type: sequelize_1.DataTypes.ENUM('lead', 'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado', 'cierre_perdido', 'firma_contrato', 'activo', 'cliente_perdido', 'lead_inactivo'),
        defaultValue: 'lead',
    },
    leadStatus: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'contacts',
    timestamps: true,
});
Contact.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'Owner' });
Contact.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' }); // Mantener para compatibilidad con empresa principal
// Relación muchos-a-muchos con empresas se inicializa en models/index.ts después de que todos los modelos estén cargados
