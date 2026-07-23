import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLFloat
} from 'graphql';
import { prisma } from '../app';

// 1. Client Type
const ClientType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Client',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    is_evil: { type: new GraphQLNonNull(GraphQLBoolean) },
    description: { type: GraphQLString },
    deliveries: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeliveryType))),
      resolve: (parent) => {
        return prisma.delivery.findMany({
          where: { client_id: parent.id }
        });
      }
    }
  })
});

// 2. Planet Type
const PlanetType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Planet',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    danger_level: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    deliveries: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeliveryType))),
      resolve: (parent) => {
        return prisma.delivery.findMany({
          where: { planet_id: parent.id }
        });
      }
    }
  })
});

// 3. CrewMember Type
const CrewMemberType: GraphQLObjectType = new GraphQLObjectType({
  name: 'CrewMember',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    role: { type: new GraphQLNonNull(GraphQLString) },
    assignments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AssignmentType))),
      resolve: (parent) => {
        return prisma.assignment.findMany({
          where: { crew_member_id: parent.id }
        });
      }
    }
  })
});

// 4. Delivery Type
const DeliveryType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Delivery',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    cargo_name: { type: new GraphQLNonNull(GraphQLString) },
    reward_cash: { type: new GraphQLNonNull(GraphQLInt) },
    status: { type: new GraphQLNonNull(GraphQLString) },
    planet_id: { type: new GraphQLNonNull(GraphQLInt) },
    client_id: { type: new GraphQLNonNull(GraphQLInt) },
    planet: {
      type: new GraphQLNonNull(PlanetType),
      resolve: (parent, _args, context) => {
        return context.loaders.planetLoader.load(parent.planet_id);
      }
    },
    client: {
      type: new GraphQLNonNull(ClientType),
      resolve: (parent, _args, context) => {
        return context.loaders.clientLoader.load(parent.client_id);
      }
    },
    assignments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AssignmentType))),
      resolve: (parent) => {
        return prisma.assignment.findMany({
          where: { delivery_id: parent.id }
        });
      }
    },
    logs: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FlightLogType))),
      resolve: (parent) => {
        return prisma.flightLog.findMany({
          where: { delivery_id: parent.id }
        });
      }
    }
  })
});

// 5. Assignment Type
const AssignmentType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Assignment',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    role_on_ship: { type: new GraphQLNonNull(GraphQLString) },
    delivery_id: { type: new GraphQLNonNull(GraphQLInt) },
    crew_member_id: { type: new GraphQLNonNull(GraphQLInt) },
    delivery: {
      type: new GraphQLNonNull(DeliveryType),
      resolve: (parent, _args, context) => {
        return context.loaders.deliveryLoader.load(parent.delivery_id);
      }
    },
    crew_member: {
      type: new GraphQLNonNull(CrewMemberType),
      resolve: (parent, _args, context) => {
        return context.loaders.crewLoader.load(parent.crew_member_id);
      }
    }
  })
});

// 6. FlightLog Type
const FlightLogType: GraphQLObjectType = new GraphQLObjectType({
  name: 'FlightLog',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    note: { type: new GraphQLNonNull(GraphQLString) },
    timestamp: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (parent) => parent.timestamp.toISOString()
    },
    delivery_id: { type: new GraphQLNonNull(GraphQLInt) },
    delivery: {
      type: new GraphQLNonNull(DeliveryType),
      resolve: (parent, _args, context) => {
        return context.loaders.deliveryLoader.load(parent.delivery_id);
      }
    }
  })
});

// 7. Query Root
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    planets: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PlanetType))),
      args: {
        search: { type: GraphQLString }
      },
      resolve: (_source, args) => {
        return prisma.planet.findMany({
          where: args.search
            ? { name: { contains: args.search, mode: 'insensitive' } }
            : {}
        });
      }
    },
    crew: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CrewMemberType))),
      resolve: () => {
        return prisma.crewMember.findMany();
      }
    },
    clients: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ClientType))),
      args: {
        search: { type: GraphQLString }
      },
      resolve: (_source, args) => {
        return prisma.client.findMany({
          where: args.search
            ? { name: { contains: args.search, mode: 'insensitive' } }
            : {}
        });
      }
    },
    deliveries: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DeliveryType))),
      resolve: () => {
        return prisma.delivery.findMany();
      }
    },
    delivery: {
      type: DeliveryType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (_source, args) => {
        return prisma.delivery.findUnique({
          where: { id: args.id }
        });
      }
    }
  }
});

// 8. Mutation Root
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createClient: {
      type: new GraphQLNonNull(ClientType),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        is_evil: { type: GraphQLBoolean }
      },
      resolve: (_source, args) => {
        return prisma.client.create({
          data: {
            name: args.name,
            is_evil: args.is_evil || false
          }
        });
      }
    },
    createDelivery: {
      type: new GraphQLNonNull(DeliveryType),
      args: {
        cargo_name: { type: new GraphQLNonNull(GraphQLString) },
        reward_cash: { type: new GraphQLNonNull(GraphQLFloat) },
        planet_id: { type: new GraphQLNonNull(GraphQLInt) },
        client_id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (_source, args) => {
        return prisma.delivery.create({
          data: {
            cargo_name: args.cargo_name,
            reward_cash: Math.round(args.reward_cash),
            planet_id: args.planet_id,
            client_id: args.client_id,
            status: 'pending'
          }
        });
      }
    },
    assignCrew: {
      type: new GraphQLNonNull(AssignmentType),
      args: {
        role_on_ship: { type: new GraphQLNonNull(GraphQLString) },
        crew_member_id: { type: new GraphQLNonNull(GraphQLInt) },
        delivery_id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (_source, args) => {
        return prisma.assignment.upsert({
          where: {
            delivery_id_crew_member_id: {
              delivery_id: args.delivery_id,
              crew_member_id: args.crew_member_id
            }
          },
          update: {
            role_on_ship: args.role_on_ship
          },
          create: {
            role_on_ship: args.role_on_ship,
            crew_member_id: args.crew_member_id,
            delivery_id: args.delivery_id
          }
        });
      }
    },
    addFlightLog: {
      type: new GraphQLNonNull(FlightLogType),
      args: {
        note: { type: new GraphQLNonNull(GraphQLString) },
        delivery_id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (_source, args) => {
        return prisma.flightLog.create({
          data: {
            note: args.note,
            delivery_id: args.delivery_id
          }
        });
      }
    }
  }
});

export const schema: GraphQLSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});
