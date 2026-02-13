"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLog = exports.UserGoogleToken = exports.MonthlyBudget = exports.ContactContact = exports.CompanyCompany = exports.DealDeal = exports.DealCompany = exports.DealContact = exports.ContactCompany = exports.Payment = exports.Subscription = exports.Ticket = exports.Automation = exports.Campaign = exports.Activity = exports.TaskComment = exports.Task = exports.Deal = exports.Company = exports.Contact = exports.Role = exports.User = void 0;
// Export all models
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
var Role_1 = require("./Role");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return Role_1.Role; } });
var Contact_1 = require("./Contact");
Object.defineProperty(exports, "Contact", { enumerable: true, get: function () { return Contact_1.Contact; } });
var Company_1 = require("./Company");
Object.defineProperty(exports, "Company", { enumerable: true, get: function () { return Company_1.Company; } });
var Deal_1 = require("./Deal");
Object.defineProperty(exports, "Deal", { enumerable: true, get: function () { return Deal_1.Deal; } });
var Task_1 = require("./Task");
Object.defineProperty(exports, "Task", { enumerable: true, get: function () { return Task_1.Task; } });
var TaskComment_1 = require("./TaskComment");
Object.defineProperty(exports, "TaskComment", { enumerable: true, get: function () { return TaskComment_1.TaskComment; } });
var Activity_1 = require("./Activity");
Object.defineProperty(exports, "Activity", { enumerable: true, get: function () { return Activity_1.Activity; } });
var Campaign_1 = require("./Campaign");
Object.defineProperty(exports, "Campaign", { enumerable: true, get: function () { return Campaign_1.Campaign; } });
var Automation_1 = require("./Automation");
Object.defineProperty(exports, "Automation", { enumerable: true, get: function () { return Automation_1.Automation; } });
var Ticket_1 = require("./Ticket");
Object.defineProperty(exports, "Ticket", { enumerable: true, get: function () { return Ticket_1.Ticket; } });
var Subscription_1 = require("./Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
var Payment_1 = require("./Payment");
Object.defineProperty(exports, "Payment", { enumerable: true, get: function () { return Payment_1.Payment; } });
var ContactCompany_1 = require("./ContactCompany");
Object.defineProperty(exports, "ContactCompany", { enumerable: true, get: function () { return ContactCompany_1.ContactCompany; } });
var DealContact_1 = require("./DealContact");
Object.defineProperty(exports, "DealContact", { enumerable: true, get: function () { return DealContact_1.DealContact; } });
var DealCompany_1 = require("./DealCompany");
Object.defineProperty(exports, "DealCompany", { enumerable: true, get: function () { return DealCompany_1.DealCompany; } });
var DealDeal_1 = require("./DealDeal");
Object.defineProperty(exports, "DealDeal", { enumerable: true, get: function () { return DealDeal_1.DealDeal; } });
var CompanyCompany_1 = require("./CompanyCompany");
Object.defineProperty(exports, "CompanyCompany", { enumerable: true, get: function () { return CompanyCompany_1.CompanyCompany; } });
var ContactContact_1 = require("./ContactContact");
Object.defineProperty(exports, "ContactContact", { enumerable: true, get: function () { return ContactContact_1.ContactContact; } });
var MonthlyBudget_1 = require("./MonthlyBudget");
Object.defineProperty(exports, "MonthlyBudget", { enumerable: true, get: function () { return MonthlyBudget_1.MonthlyBudget; } });
var UserGoogleToken_1 = require("./UserGoogleToken");
Object.defineProperty(exports, "UserGoogleToken", { enumerable: true, get: function () { return UserGoogleToken_1.UserGoogleToken; } });
var SystemLog_1 = require("./SystemLog");
Object.defineProperty(exports, "SystemLog", { enumerable: true, get: function () { return SystemLog_1.SystemLog; } });
// Import all models to ensure they are registered
// Importar modelos base primero
require("./Role");
require("./User");
require("./Company");
require("./Contact");
// Importar modelo intermedio después de los modelos base
require("./ContactCompany");
require("./DealContact");
require("./DealCompany");
require("./DealDeal");
require("./CompanyCompany");
require("./ContactContact");
// Luego los demás modelos
require("./Deal");
require("./Task");
require("./TaskComment");
require("./Activity");
require("./Campaign");
require("./Automation");
require("./Ticket");
require("./Subscription");
require("./Payment");
require("./MonthlyBudget");
require("./UserGoogleToken");
require("./SystemLog");
// Inicializar relaciones muchos-a-muchos después de que todos los modelos estén cargados
const Contact_2 = require("./Contact");
const Company_2 = require("./Company");
const Deal_2 = require("./Deal");
const DealDeal_2 = require("./DealDeal");
const CompanyCompany_2 = require("./CompanyCompany");
const ContactContact_2 = require("./ContactContact");
// Inicializar relaciones muchos-a-muchos
Contact_2.Contact.belongsToMany(Company_2.Company, {
    through: 'contact_companies',
    foreignKey: 'contactId',
    otherKey: 'companyId',
    as: 'Companies'
});
Company_2.Company.belongsToMany(Contact_2.Contact, {
    through: 'contact_companies',
    foreignKey: 'companyId',
    otherKey: 'contactId',
    as: 'Contacts'
});
Deal_2.Deal.belongsToMany(Contact_2.Contact, {
    through: 'deal_contacts',
    foreignKey: 'dealId',
    otherKey: 'contactId',
    as: 'Contacts'
});
Contact_2.Contact.belongsToMany(Deal_2.Deal, {
    through: 'deal_contacts',
    foreignKey: 'contactId',
    otherKey: 'dealId',
    as: 'Deals'
});
Deal_2.Deal.belongsToMany(Company_2.Company, {
    through: 'deal_companies',
    foreignKey: 'dealId',
    otherKey: 'companyId',
    as: 'Companies'
});
Company_2.Company.belongsToMany(Deal_2.Deal, {
    through: 'deal_companies',
    foreignKey: 'companyId',
    otherKey: 'dealId',
    as: 'Deals'
});
// Relación muchos-a-muchos entre Deal y Deal
Deal_2.Deal.belongsToMany(Deal_2.Deal, {
    through: DealDeal_2.DealDeal,
    foreignKey: 'dealId',
    otherKey: 'relatedDealId',
    as: 'Deals'
});
// Relación inversa para obtener negocios que están vinculados CON este deal
Deal_2.Deal.belongsToMany(Deal_2.Deal, {
    through: DealDeal_2.DealDeal,
    foreignKey: 'relatedDealId',
    otherKey: 'dealId',
    as: 'RelatedDeals'
});
// Relación muchos-a-muchos entre Company y Company
Company_2.Company.belongsToMany(Company_2.Company, {
    through: CompanyCompany_2.CompanyCompany,
    foreignKey: 'companyId',
    otherKey: 'relatedCompanyId',
    as: 'Companies'
});
// Relación inversa para obtener empresas que están vinculadas CON esta empresa
Company_2.Company.belongsToMany(Company_2.Company, {
    through: CompanyCompany_2.CompanyCompany,
    foreignKey: 'relatedCompanyId',
    otherKey: 'companyId',
    as: 'RelatedCompanies'
});
// Relación muchos-a-muchos entre Contact y Contact
Contact_2.Contact.belongsToMany(Contact_2.Contact, {
    through: ContactContact_2.ContactContact,
    foreignKey: 'contactId',
    otherKey: 'relatedContactId',
    as: 'Contacts'
});
// Relación inversa para obtener contactos que están vinculados CON este contacto
Contact_2.Contact.belongsToMany(Contact_2.Contact, {
    through: ContactContact_2.ContactContact,
    foreignKey: 'relatedContactId',
    otherKey: 'contactId',
    as: 'RelatedContacts'
});
