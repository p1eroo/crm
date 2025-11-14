// Export all models
export { User } from './User';
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

// Import all models to ensure they are registered
// Importar modelos base primero
import './User';
import './Company';
import './Contact';
// Importar modelo intermedio después de los modelos base
import './ContactCompany';
// Luego los demás modelos
import './Deal';
import './Task';
import './Activity';
import './Campaign';
import './Automation';
import './Ticket';
import './Subscription';
import './Payment';

// Inicializar relaciones muchos-a-muchos después de que todos los modelos estén cargados
import { Contact } from './Contact';
import { Company } from './Company';

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




