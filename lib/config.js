'use babel';

export default {

    codeforcesHandle: {
        title: 'Codeforces Handle',
        order: 1,
        type: 'string',
        default: 'mariand'
    },

    programmingLanguage: {
        title: 'Programming Language',
        order: 2,
        description: 'The chosen language will only be used for submitting a source file.',
        type: 'integer',
        default: 61,
        enum: [
            { value: 43, description: 'GNU GCC C11 5.1.0' },
            { value: 52, description: 'Clang++17 Diagnostics' },
            { value: 42, description: 'GNU G++11 5.1.0' },
            { value: 50, description: 'GNU G++14 6.4.0' },
            { value: 54, description: 'GNU G++17 7.3.0' },
            { value: 2, description: 'Microsoft Visual C++ 2010' },
            { value: 59, description: 'Microsoft Visual C++ 2017' },
            { value: 61, description: 'GNU G++17 9.2.0 (64 bit, msys 2)' },
            { value: 9, description: 'C# Mono 5.18' },
            { value: 28, description: 'D DMD32 v2.091.0' },
            { value: 32, description: 'Go 1.14' },
            { value: 12, description: 'Haskell GHC 8.6.3' },
            { value: 60, description: 'Java 11.0.5' },
            { value: 36, description: 'Java 1.8.0_162' },
            { value: 48, description: 'Kotlin 1.3.70' },
            { value: 19, description: 'OCaml 4.02.1' },
            { value: 3, description: 'Delphi 7' },
            { value: 4, description: 'Free Pascal 3.0.2' },
            { value: 51, description: 'PascalABC.NET 3.4.2' },
            { value: 13, description: 'Perl 5.20.1' },
            { value: 6, description: 'PHP 7.2.13' },
            { value: 7, description: 'Python 2.7.15' },
            { value: 31, description: 'Python 3.7.2' },
            { value: 40, description: 'PyPy 2.7 (7.2.0)' },
            { value: 41, description: 'PyPy 3.6 (7.2.0)' },
            { value: 8, description: 'Ruby 2.0.0p645' },
            { value: 49, description: 'Rust 1.42.0' },
            { value: 20, description: 'Scala 2.12.8' },
            { value: 34, description: 'JavaScript V8 4.8.0' },
            { value: 55, description: 'Node.js 9.4.0' }
        ]
    },

    compilationCommand: {
        title: 'Compilation Command',
        order: 3,
        description: 'Remember to also adjust the executable file name in the file structure settings if necessary.',
        type: 'string',
        default: 'g++ -std=c++17 -g -Wall -Wextra -fsanitize=undefined,address -DGLIBCXX_DEBUG <%= problem %>.cpp'
    },

    autoCompilation: {
        title: 'Auto Compilation',
        order: 4,
        description: 'When switched on, the source file will be compiled automatically when saved.',
        type: 'boolean',
        default: true
    },

    autoEvaluation: {
        title: 'Auto Evaluation',
        order: 5,
        description: 'When switched on, the executable will be run automatically on all examples when changed.',
        type: 'boolean',
        default: true
    },

    templateSnippet: {
        title: 'Template Snippet',
        order: 6,
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
    },

    fileStructure: {
        title: 'File structure',
        order: 7,
        description: 'You can always use `<%= problem %>` to insert the problem index (e.g. `A` or `E1`) and (for the example files) `<%= name %>` to insert the example name (for the default examples, these are `1`, `2` and so on). Look at [Lodash Template](https://lodash.com/docs/#template) for more information (e.g. changing the names to lower case).\n\n**Warning**: Changing these settings does not move your files accordingly in your existing contests. You need to do that manually.',
        type: 'object',
        properties: {
            problemDirectory: {
                title: 'Problem Directory',
                order: 1,
                description: 'All files belonging to a problem will be in this directory, which has to be inside of the contest folder. Its name should not be the same for two different problems.',
                type: 'string',
                default: '<%= problem %>'
            },
            sourceFileName: {
                title: 'Source File Name',
                order: 2,
                description: 'The source file has to be directly inside of the problem directory. The name does not have to include the problem index.',
                type: 'string',
                default: '<%= problem %>.cpp'
            },
            executableName: {
                title: 'Executable Name',
                order: 3,
                description: 'This should be the name of the file that the compilation command creates.',
                type: 'string',
                default: 'a.out'
            },
            inputFileName: {
                title: 'Input File Name',
                order: 4,
                description: 'The name of an input file inside of the problem directory.',
                type: 'string',
                default: 'examples/<%= name %>.in'
            },
            inputFileRegex: {
                title: 'Input File Regex',
                order: 5,
                description: 'A (JavaScript) regular expression that matches if a file name is an input file. Should return the example name as the first and only group.',
                type: 'string',
                default: '^examples/(.*)\\.in$'
            },
            outputFileName: {
                title: 'Output File Name',
                order: 6,
                description: 'The name of an output file inside of the problem directory.',
                type: 'string',
                default: 'examples/<%= name %>.out'
            },
            outputFileRegex: {
                title: 'Output File Regex',
                order: 7,
                description: 'A (JavaScript) regular expression that matches if a file name is an output file. Should return the example name as the first and only group.',
                type: 'string',
                default: '^examples/(.*)\\.out$'
            }
        }
    }

}
