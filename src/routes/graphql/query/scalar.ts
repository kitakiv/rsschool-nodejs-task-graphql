import { GraphQLScalarType, Kind } from 'graphql';

const scalar = new GraphQLScalarType({
    name: 'UUID',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => {
        if (ast.kind === Kind.STRING) {
            return ast.value;
        }
        return undefined;
    },
});

export { scalar };