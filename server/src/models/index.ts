// Export all models
export { User } from './User';
export { Role } from './Role';
export { Contact } from './Contact';
export { Company } from './Company';
export { Deal } from './Deal';
export { Task } from './Task';
export { TaskComment } from './TaskComment';
export { Activity } from './Activity';
export { Campaign } from './Campaign';
export { Automation } from './Automation';
export { Ticket } from './Ticket';
export { Subscription } from './Subscription';
export { Payment } from './Payment';
export { ContactCompany } from './ContactCompany';
export { DealContact } from './DealContact';
export { DealCompany } from './DealCompany';
export { DealDeal } from './DealDeal';
export { CompanyCompany } from './CompanyCompany';
export { ContactContact } from './ContactContact';
export { MonthlyBudget } from './MonthlyBudget';
export { UserGoogleToken } from './UserGoogleToken';
export { SystemLog } from './SystemLog';

// Import all models to ensure they are registered
// Importar modelos base primero
import './Role';
import './User';
import './Company';
import './Contact';
// Importar modelo intermedio después de los modelos base
import './ContactCompany';
import './DealContact';
import './DealCompany';
import './DealDeal';
import './CompanyCompany';
import './ContactContact';
// Luego los demás modelos
import './Deal';
import './Task';
import './TaskComment';
import './Activity';
import './Campaign';
import './Automation';
import './Ticket';
import './Subscription';
import './Payment';
import './MonthlyBudget';
import './UserGoogleToken';
import './SystemLog';

// Inicializar relaciones muchos-a-muchos después de que todos los modelos estén cargados
import { Contact } from './Contact';
import { Company } from './Company';
import { Deal } from './Deal';
import { DealDeal } from './DealDeal';
import { CompanyCompany } from './CompanyCompany';
import { ContactContact } from './ContactContact';

// Inicializar relaciones muchos-a-muchos
Contact.belongsToMany(Company, { 
  through: 'contact_companies', 
  foreignKey: 'contactId', 
  otherKey: 'companyId',
  as: 'Companies'
});

Company.belongsToMany(Contact, { 
  through: 'contact_companies', 
  foreignKey: 'companyId', 
  otherKey: 'contactId',
  as: 'Contacts'
});

Deal.belongsToMany(Contact, {
  through: 'deal_contacts',
  foreignKey: 'dealId',
  otherKey: 'contactId',
  as: 'Contacts'
});

Contact.belongsToMany(Deal, {
  through: 'deal_contacts',
  foreignKey: 'contactId',
  otherKey: 'dealId',
  as: 'Deals'
});

Deal.belongsToMany(Company, {
  through: 'deal_companies',
  foreignKey: 'dealId',
  otherKey: 'companyId',
  as: 'Companies'
});

Company.belongsToMany(Deal, {
  through: 'deal_companies',
  foreignKey: 'companyId',
  otherKey: 'dealId',
  as: 'Deals'
});

// Relación muchos-a-muchos entre Deal y Deal
Deal.belongsToMany(Deal, {
  through: DealDeal,
  foreignKey: 'dealId',
  otherKey: 'relatedDealId',
  as: 'Deals'
});

// Relación inversa para obtener negocios que están vinculados CON este deal
Deal.belongsToMany(Deal, {
  through: DealDeal,
  foreignKey: 'relatedDealId',
  otherKey: 'dealId',
  as: 'RelatedDeals'
});

// Relación muchos-a-muchos entre Company y Company
Company.belongsToMany(Company, {
  through: CompanyCompany,
  foreignKey: 'companyId',
  otherKey: 'relatedCompanyId',
  as: 'Companies'
});

// Relación inversa para obtener empresas que están vinculadas CON esta empresa
Company.belongsToMany(Company, {
  through: CompanyCompany,
  foreignKey: 'relatedCompanyId',
  otherKey: 'companyId',
  as: 'RelatedCompanies'
});

// Relación muchos-a-muchos entre Contact y Contact
Contact.belongsToMany(Contact, {
  through: ContactContact,
  foreignKey: 'contactId',
  otherKey: 'relatedContactId',
  as: 'Contacts'
});

// Relación inversa para obtener contactos que están vinculados CON este contacto
Contact.belongsToMany(Contact, {
  through: ContactContact,
  foreignKey: 'relatedContactId',
  otherKey: 'contactId',
  as: 'RelatedContacts'
});




