import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType,
} from 'graphql';
import { scalar } from '../query/scalar.js';
import db from '../database/data.js';
import { user, profile, post, memberTypeId } from '../query/query.js';

const createUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const createProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(scalar) },
    memberTypeId: { type: new GraphQLNonNull(memberTypeId) },
  },
});

const createPostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(scalar) },
  },
});

const changeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const changeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: memberTypeId },
  },
});

const changePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  },
});

const mutations = new GraphQLObjectType({
  name: 'Mutations',
  fields: {
    createUser: {
      type: new GraphQLNonNull(user),
      args: {
        dto: { type: new GraphQLNonNull(createUserInput) },
      },
      resolve: (_, args: { dto: { name: string; balance: number } }) => {
        return db.prisma.user.create({ data: args.dto });
      },
    },
    createProfile: {
      type: new GraphQLNonNull(profile),
      args: {
        dto: { type: new GraphQLNonNull(createProfileInput) },
      },
      resolve: (
        _,
        args: {
          dto: {
            isMale: boolean;
            yearOfBirth: number;
            userId: string;
            memberTypeId: string;
          };
        },
      ) => {
        return db.prisma.profile.create({ data: args.dto });
      },
    },
    createPost: {
      type: new GraphQLNonNull(post),
      args: {
        dto: { type: new GraphQLNonNull(createPostInput) },
      },
      resolve: (
        _,
        args: { dto: { title: string; content: string; authorId: string } },
      ) => {
        return db.prisma.post.create({ data: args.dto });
      },
    },
    changePost: {
      type: new GraphQLNonNull(post),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
        dto: { type: new GraphQLNonNull(changePostInput) },
      },
      resolve: (_, args: { id: string; dto: { title?: string; content?: string } }) => {
        return db.prisma.post.update({
          where: {
            id: args.id,
          },
          data: args.dto,
        });
      },
    },
    changeProfile: {
      type: new GraphQLNonNull(profile),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
        dto: { type: new GraphQLNonNull(changeProfileInput) },
      },
      resolve: (
        _,
        args: {
          id: string;
          dto: { isMale?: boolean; yearOfBirth?: number; memberTypeId?: string };
        },
      ) => {
        return db.prisma.profile.update({
          where: {
            id: args.id,
          },
          data: args.dto,
        });
      },
    },
    changeUser: {
      type: new GraphQLNonNull(user),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
        dto: { type: new GraphQLNonNull(changeUserInput) },
      },
      resolve: (_, args: { id: string; dto: { name?: string; balance?: number } }) => {
        return db.prisma.user.update({
          where: {
            id: args.id,
          },
          data: args.dto,
        });
      },
    },
    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: async(_, args: { id: string }) => {
        const post = await db.prisma.post.findUnique({
          where: {
            id: args.id,
          },
        });
        if (post) {
          await db.prisma.post.delete({
            where: {
              id: args.id,
            },
          });
          return 'Post deleted';
        }
        return 'Post not found';
      }
    },
    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: async (_, args: { id: string }) => {
        const profile = await db.prisma.profile.findUnique({
          where: {
            id: args.id,
          },
        });
        if (profile) {
          await db.prisma.profile.delete({
            where: {
              id: args.id,
            },
          });
          return 'Profile deleted';
        }
        return 'Profile not found';
      },
    },
    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: async (_, args: { id: string }) => {
        const user = await db.prisma.user.findUnique({
          where: {
            id: args.id,
          },
        })
        if (user) {
          await db.prisma.user.delete({
            where: {
              id: args.id,
            },
          });
          return 'User deleted';
        }
        return 'User not found';
      },
    },
    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(scalar) },
        authorId: { type: new GraphQLNonNull(scalar) },
      },
      resolve: async (_, args: { userId: string; authorId: string }) => {
        await db.prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: args.userId,
            authorId: args.authorId,
          },
        });
        return 'Subscribed';
      },
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(scalar) },
        authorId: { type: new GraphQLNonNull(scalar) },
      },
      resolve: async(_, args: { userId: string; authorId: string }) => {
        await db.prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: args.userId,
              authorId: args.authorId,
            },
          },
        });
        return 'Unsubscribed';
      },
    },
  },
});

export default mutations;
