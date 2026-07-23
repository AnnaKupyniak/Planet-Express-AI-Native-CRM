import DataLoader from 'dataloader';
import { prisma } from '../app';

export const createDataLoaders = () => ({
  planetLoader: new DataLoader(async (keys: readonly number[]) => {
    const planets = await prisma.planet.findMany({
      where: { id: { in: keys as number[] } }
    });
    const planetMap = new Map(planets.map(p => [p.id, p]));
    return keys.map(key => planetMap.get(key) || null);
  }),
  clientLoader: new DataLoader(async (keys: readonly number[]) => {
    const clients = await prisma.client.findMany({
      where: { id: { in: keys as number[] } }
    });
    const clientMap = new Map(clients.map(c => [c.id, c]));
    return keys.map(key => clientMap.get(key) || null);
  }),
  crewLoader: new DataLoader(async (keys: readonly number[]) => {
    const crew = await prisma.crewMember.findMany({
      where: { id: { in: keys as number[] } }
    });
    const crewMap = new Map(crew.map(c => [c.id, c]));
    return keys.map(key => crewMap.get(key) || null);
  }),
  deliveryLoader: new DataLoader(async (keys: readonly number[]) => {
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: keys as number[] } }
    });
    const deliveryMap = new Map(deliveries.map(d => [d.id, d]));
    return keys.map(key => deliveryMap.get(key) || null);
  }),
});
