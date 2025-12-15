import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Company } from './Company';

interface ContactAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  companyId?: number;
  ownerId?: number | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
  lifecycleStage: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
  leadStatus?: string;
  tags?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'phone' | 'mobile' | 'jobTitle' | 'companyId' | 'ownerId' | 'address' | 'city' | 'state' | 'country' | 'postalCode' | 'website' | 'facebook' | 'twitter' | 'github' | 'linkedin' | 'youtube' | 'leadStatus' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone?: string;
  public mobile?: string;
  public jobTitle?: string;
  public companyId?: number;
  public ownerId?: number | null;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public postalCode?: string;
  public website?: string;
  public facebook?: string;
  public twitter?: string;
  public github?: string;
  public linkedin?: string;
  public youtube?: string;
  public lifecycleStage!: 'lead' | 'contacto' | 'reunion_agendada' | 'reunion_efectiva' | 'propuesta_economica' | 'negociacion' | 'licitacion' | 'licitacion_etapa_final' | 'cierre_ganado' | 'cierre_perdido' | 'firma_contrato' | 'activo' | 'cliente_perdido' | 'lead_inactivo';
  public leadStatus?: string;
  public tags?: string[];
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Owner?: User;
  public Company?: Company;
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    twitter: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    github: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lifecycleStage: {
      type: DataTypes.ENUM('lead', 'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado', 'cierre_perdido', 'firma_contrato', 'activo', 'cliente_perdido', 'lead_inactivo'),
      defaultValue: 'lead',
    },
    leadStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    timestamps: true,
  }
);

Contact.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });
Contact.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' }); // Mantener para compatibilidad con empresa principal

// Relación muchos-a-muchos con empresas se inicializa en models/index.ts después de que todos los modelos estén cargados





