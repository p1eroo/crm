import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ContactContactAttributes {
  contactId: number;
  relatedContactId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContactContact extends Model<ContactContactAttributes> implements ContactContactAttributes {
  public contactId!: number;
  public relatedContactId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContactContact.init(
  {
    contactId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'contacts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    relatedContactId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'contacts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'contact_contacts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['contactId', 'relatedContactId'],
      },
    ],
  }
);

export default ContactContact;
