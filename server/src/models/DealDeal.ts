import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface DealDealAttributes {
  dealId: number;
  relatedDealId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DealDeal extends Model<DealDealAttributes> implements DealDealAttributes {
  public dealId!: number;
  public relatedDealId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DealDeal.init(
  {
    dealId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'deals',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    relatedDealId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'deals',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'deal_deals',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['dealId', 'relatedDealId'],
      },
    ],
  }
);

export default DealDeal;
