'use babel';

export default {

    codeforcesHandle: {
        title: 'Codeforces Handle',
        type: 'string',
        default: 'mariand'
    },

    templateSnippet: {
        title: 'Template Snippet',
        description: 'The given snippet will be used as a template for all automatically created source files.',
        type: 'object',
        properties: {
            scope: {
                title: 'Snippet Scope',
                description: 'The scope of the snippet, as given in the `snippet.cson` file.',
                type: 'string',
                default: '.source.cpp'
            },
            prefix: {
                title: 'Snippet Prefix',
                description: 'The prefix of the snippet, as given in the `snippet.cson` file.',
                type: 'string',
                default: 'con'
            }
        }
    }

}
