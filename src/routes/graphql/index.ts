import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLSchema, specifiedRules } from 'graphql';
import { query } from './query/query.js';
import db from './database/data.js';
import mutations from './mutation/mutation.js';
import DataLoader from 'dataloader';
import { validate, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit';

const schema = new GraphQLSchema({
  query,
  mutation: mutations,
});

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  db.prisma = prisma;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const validationRules = [
        depthLimit(5),
        ...specifiedRules
      ];
      const validationErrors = validate(schema, parse(req.body.query), validationRules);
      if (validationErrors.length > 0) {
        return { errors: validationErrors }
      } else {
        return  graphql({
          schema,
          source: req.body.query,
          variableValues: req.body.variables,
          contextValue: {
              postsLoader: new DataLoader(async (authorIds: readonly string[]) => {
                const posts = await prisma.post.findMany({
                  where: { authorId: { in: authorIds as string[] } },
                });
                const postsByAuthor = authorIds.map((authorId) =>
                  posts.filter((post) => post.authorId === authorId)
                );
                return postsByAuthor;
              }),
              memberTypeLoader: new DataLoader(async (parentIds: readonly string[]) => {
                const memberTypes = await prisma.memberType.findMany({
                  where: {
                    id: { in: parentIds as string[] },
                  }
                });
                const profilesByParentId = parentIds.map((parentId) =>
                  memberTypes.find((memberType) => memberType.id === parentId)
                );
                return profilesByParentId;
              }),
              profilesLoader: new DataLoader(async (usersIds: readonly string[]) => {
                const profiles = await prisma.profile.findMany({
                  where: { userId: { in: usersIds as string[] } },
                });
                const profilesByAuthor = usersIds.map((userId) =>
                  profiles.find((profile) => profile.userId === userId)
                );
                return profilesByAuthor;
              }),
              userSubscribedToLoader: new DataLoader(async (parentIds: readonly string[]) => {
                const users = await prisma.user.findMany({
                  where: {
                    subscribedToUser: {
                      some: {
                        subscriberId: { in: parentIds as string[] },
                      }
                    },
                  },
                  include: {
                    subscribedToUser: true
                  }
                });
                const usersByParentId = parentIds.map((parentId) => {
                  return users.filter((user) => {
                    const { subscribedToUser } = user;
                    if (subscribedToUser) {
                      return subscribedToUser.some((subscribedTo) => subscribedTo.subscriberId === parentId)
                    }
                    return false
                  })
                }
  
                );
  
                return usersByParentId;
              }),
              subscribedToUserLoader: new DataLoader(async (parentIds: readonly string[]) => {
                const users = await prisma.user.findMany({
                  where: {
                    userSubscribedTo: {
                      some: {
                        authorId: { in: parentIds as string[] },
                      }
                    },
                  },
                  include: {
                    userSubscribedTo: true
                  }
                });
                const usersByParentId = parentIds.map((parentId) => {
                  return users.filter((user) => {
                    const { userSubscribedTo } = user;
                    if (userSubscribedTo) {
                      return userSubscribedTo.some((subscribedTo) => subscribedTo.authorId === parentId)
                    }
                    return false
                  })
                }
                );
                return usersByParentId;
              }),
          }
        });
      }
    },
  });
};

export default plugin;
