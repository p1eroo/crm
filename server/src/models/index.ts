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
export { MonthlyBudget } from './MonthlyBudget';
export { UserGoogleToken } from './UserGoogleToken';

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

// Inicializar relaciones muchos-a-muchos después de que todos los modelos estén cargados
import { Contact } from './Contact';
import { Company } from './Company';
import { Deal } from './Deal';

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




