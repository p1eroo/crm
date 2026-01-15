// Export all models
export { User } from './User';
export { Role } from './Role';
export { Contact } from './Contact';
export { Company } from './Company';
export { Deal } from './Deal';
export { Task } from './Task';
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
// Luego los demás modelos
import './Deal';
import './Task';
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




