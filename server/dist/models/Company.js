"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Company extends sequelize_1.Model {
}
exports.Company = Company;
Company.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    domain: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    companyname: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    leadSource: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    ruc: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    idClienteEmpresa: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
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
    linkedin: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    numberOfEmployees: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    estimatedRevenue: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    isRecoveredClient: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    ownerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    lifecycleStage: {
        type: sequelize_1.DataTypes.ENUM('lead', 'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado', 'cierre_perdido', 'firma_contrato', 'activo', 'cliente_perdido', 'lead_inactivo'),
        defaultValue: 'lead',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'companies',
    timestamps: true,
    // Hacer que Sequelize ignore campos que no existen en la base de datos
    omitNull: false,
});
Company.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'Owner' });
// Relación muchos-a-muchos con contactos se inicializa en models/index.ts después de que todos los modelos estén cargados
