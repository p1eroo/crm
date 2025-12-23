import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface DealContactAttributes {
  id: number;
  dealId: number;
  contactId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DealContact extends Model<DealContactAttributes> implements DealContactAttributes {
  public id!: number;
  public dealId!: number;
  public contactId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DealContact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dealId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'deals',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'deal_contacts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['dealId', 'contactId'],
      },
    ],
  }
);

export default DealContact;





