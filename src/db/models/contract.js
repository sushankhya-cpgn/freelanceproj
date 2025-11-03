'use strict';
const { Model } = require('sequelize');
// const DefaultFields = require('./defaultFields');

module.exports = (sequelize, DataTypes) => {
    class Contract extends Model {
        static associate(models) {
            // A contract belongs to a client (User)
            this.belongsTo(models.User, {
                foreignKey: 'clientId',
                as: 'client',
            });
            
            // A contract belongs to a freelancer
            this.belongsTo(models.Freelancer, {
                foreignKey: 'freelancerId',
                as: 'freelancer',
                allowNull: true,
            });
            
            // A contract belongs to an organization
            this.belongsTo(models.Organization, {
                foreignKey: 'organizationId',
                as: 'organization',
            });
            
            // A contract can belong to an agency
            this.belongsTo(models.Agency, {
                foreignKey: 'agencyId',
                as: 'agency',
                allowNull: true,
            });
            
            // A contract can belong to a job application
            this.belongsTo(models.JobApplication, {
                foreignKey: 'jobApplicationId',
                as: 'jobApplication',
                allowNull: true,
            });
            
            // A contract can have multiple messages
            this.hasMany(models.Message, {
                foreignKey: 'contractId',
                as: 'messages',
            });
        }
    }

    Contract.init(
        {
            vendorId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'Vendors',
                    key: 'id',
                },
            },
            freelancerId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'freelancers',
                    key: 'id',
                },
            },
            organizationId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'organizations',
                    key: 'id',
                },
            },
            contractStartDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            contractEndDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            contractTerms: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('active', 'expired', 'terminated'),
                allowNull: false,
                defaultValue: 'active',
            },
            signedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            Aadhar_number: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_nda: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            is_msa: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            ve_address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            area: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            adr_location: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            arbitration_venue: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            bank_number: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ifsc_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            branch_code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            payment_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            is_other: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            ck_editer_data: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            
            // New fields for enhanced contract functionality
            clientId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            agencyId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'agencies',
                    key: 'id',
                },
            },
            jobApplicationId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'job_applications',
                    key: 'id',
                },
            },
            // Work details
            workTitle: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            workDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            deliverables: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            milestones: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            // Payment details
            totalAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            hourlyRate: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            paymentSchedule: {
                type: DataTypes.ENUM('hourly', 'fixed', 'milestone'),
                allowNull: true,
            },
            // Contract workflow
            contractStatus: {
                type: DataTypes.ENUM('draft', 'pending', 'active', 'completed', 'cancelled', 'disputed'),
                defaultValue: 'draft',
            },
            // Work completion
            workCompleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            completionDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            // Payment release
            paymentReleased: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            paymentReleaseDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            // Stripe payment details
            stripePaymentIntentId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            // Dispute resolution
            disputeReason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            disputeResolution: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            // Rating system - client rates freelancer
            clientRating: {
                type: DataTypes.DECIMAL(2, 1),
                allowNull: true,
                validate: {
                    min: 1.0,
                    max: 5.0
                }
            },
            clientReview: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            ratedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            }

        },
        {
            sequelize,
            modelName: 'Contract',
            tableName: 'contracts',
        }
    );

    return Contract;
};