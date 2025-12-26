"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const Deal_1 = require("../models/Deal");
const DealCompany_1 = require("../models/DealCompany");
const DealContact_1 = require("../models/DealContact");
const DealDeal_1 = require("../models/DealDeal");
async function deleteTestDeal() {
    try {
        await database_1.sequelize.authenticate();
        console.log('Conexión a la base de datos establecida.');
        // Buscar el negocio de prueba por nombre
        const dealName = 'Evento - Minibuses - Pentagonito';
        const deal = await Deal_1.Deal.findOne({ where: { name: dealName } });
        if (!deal) {
            console.log(`No se encontró el negocio "${dealName}"`);
            return;
        }
        console.log(`Negocio encontrado: ID ${deal.id} - ${deal.name}`);
        // Eliminar relaciones muchos-a-muchos primero
        await DealCompany_1.DealCompany.destroy({ where: { dealId: deal.id } });
        console.log('Relaciones con empresas eliminadas.');
        await DealContact_1.DealContact.destroy({ where: { dealId: deal.id } });
        console.log('Relaciones con contactos eliminadas.');
        // Eliminar relaciones con otros negocios
        await DealDeal_1.DealDeal.destroy({
            where: {
                [sequelize_1.Op.or]: [
                    { dealId: deal.id },
                    { relatedDealId: deal.id }
                ]
            }
        });
        console.log('Relaciones con otros negocios eliminadas.');
        // Eliminar el negocio
        await deal.destroy();
        console.log(`✅ Negocio "${dealName}" eliminado exitosamente.`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error al eliminar el negocio:', error);
        process.exit(1);
    }
}
deleteTestDeal();
