import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLSchema } from 'graphql';
import { query } from './query/query.js';
import db from './database/data.js';
import mutations from './mutation/mutation.js';
import DataLoader from 'dataloader';
import { Profile } from '@prisma/client';

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
      return graphql({
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
        }
      });
    },
  });
};

export default plugin;
