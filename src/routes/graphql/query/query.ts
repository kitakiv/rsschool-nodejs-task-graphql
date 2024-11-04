/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import { scalar } from './scalar.js';
import db from '../database/data.js';
import { MemberTypeId } from '../../member-types/schemas.js';
import DataLoader from 'dataloader';
import { Post } from '@prisma/client';
import { parseResolveInfo } from 'graphql-parse-resolve-info';

const memberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: {
      value: 'BASIC',
    },
    BUSINESS: {
      value: 'BUSINESS',
    },
  },
});

const memberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(memberTypeId) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const post = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: { type: new GraphQLNonNull(scalar) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const profile = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: { type: new GraphQLNonNull(scalar) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberType: { type: new GraphQLNonNull(memberType),
      resolve: (parent: { memberTypeId: string }, _, {memberTypeLoader}: {memberTypeLoader: DataLoader<string, MemberTypeId>}) => {
        return memberTypeLoader.load(parent.memberTypeId);
      },
    },
  },
});

const user = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(scalar) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: profile,
      resolve: (parent, _, contextValue) => {
        return contextValue.profilesLoader.load(parent.id);
      }
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(post))),
      resolve: async (parent: { id: string }, _, { postsLoader }: { postsLoader: DataLoader<string, Post[]> }) => {
        return await postsLoader.load(parent.id);
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(user))),
      resolve: async(parent: { id: string }, _, contextValue) => {
        return await contextValue.userSubscribedToLoader.load(parent.id);
      }
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(user))),
      resolve: (parent: { id: string }, _, contextValue) => {
        return contextValue.subscribedToUserLoader.load(parent.id);
      }
    },
  }),
});

const query = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(memberType))),
      resolve: () => db.prisma.memberType.findMany(),
    },
    memberType: {
      type: memberType,
      args: {
        id: { type: new GraphQLNonNull(memberTypeId) },
      },
      resolve: (_, args: { id: MemberTypeId }) =>
        db.prisma.memberType.findUnique({ where: { id: args.id } }),
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(user))),
      resolve: async (_, __, contextValue, info) => {
        const resolveInfo = parseResolveInfo(info);
        const fields = resolveInfo?.fieldsByTypeName?.User || {};
        const include: { posts?: boolean, profile?: boolean, userSubscribedTo?: boolean, subscribedToUser?: boolean} = {};
        if (fields['posts']) {
          include.posts = true;
        }
        if (fields['profile']) {
          include.profile = true;
        }
        if (fields['userSubscribedTo']) {
          include.userSubscribedTo = true;
        }
        if (fields['subscribedToUser']) {
          include.subscribedToUser = true;
        }
        return db.prisma.user.findMany({ include });
      }
    },
    user: {
      type: user as GraphQLObjectType,
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: (_, args: { id: string }) =>
        db.prisma.user.findUnique({ where: { id: args.id } }),
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(post))),
      resolve: () => db.prisma.post.findMany(),
    },
    post: {
      type: post,
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: (_, args: { id: string }) =>
        db.prisma.post.findUnique({ where: { id: args.id } }),
    },
    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(profile))),
      resolve: () => db.prisma.profile.findMany(),
    },
    profile: {
      type: profile,
      args: {
        id: { type: new GraphQLNonNull(scalar) },
      },
      resolve: (_, args: { id: string }) =>
        db.prisma.profile.findUnique({ where: { id: args.id } }),
    },
  },
});

export { query, memberTypeId, post, profile, user };
