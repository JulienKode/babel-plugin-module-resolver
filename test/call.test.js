import { transform } from '@babel/core';
import plugin from '../src';


// all calls take a path as the first argument
const calls = [
  'require',
  'require.resolve',
  'System.import',
  'jest.genMockFromModule',
  'jest.mock',
  'jest.unmock',
  'jest.doMock',
  'jest.dontMock',
  'jest.setMock',
  'jest.requireActual',
  'require.requireActual',
  'require.requireMock',
];

describe('function and method calls', () => {
  const transformerOpts = {
    babelrc: false,
    plugins: [
      [plugin, {
        root: './test/testproject/src',
        alias: {
          test: './test/testproject/test',
        },
      }],
    ],
  };

  calls.forEach((name) => {
    describe(name, () => {
      it('should resolve the path based on the root config', () => {
        const code = `${name}("components/Header/SubHeader", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}("./test/testproject/src/components/Header/SubHeader", ...args);`);
      });

      it('should alias the path', () => {
        const code = `${name}("test", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}("./test/testproject/test", ...args);`);
      });

      it('should not change a relative path', () => {
        const code = `${name}("./utils", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}("./utils", ...args);`);
      });

      it('should handle no arguments', () => {
        const code = `${name}();`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}();`);
      });

      it('should handle the first argument not being a string literal', () => {
        const code = `${name}(path, ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}(path, ...args);`);
      });

      it('should handle an empty path', () => {
        const code = `${name}('', ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}('', ...args);`);
      });

      it('should ignore the call if the method name is not fully matched (suffix)', () => {
        const code = `${name}.after("components/Sidebar/Footer", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`${name}.after("components/Sidebar/Footer", ...args);`);
      });

      it('should ignore the call if the method name is not fully matched (prefix)', () => {
        const code = `before.${name}("components/Sidebar/Footer", ...args);`;
        const result = transform(code, transformerOpts);

        expect(result.code).toBe(`before.${name}("components/Sidebar/Footer", ...args);`);
      });
    });
  });

  it('should resolve the path if the method name is a string literal', () => {
    const code = 'require["resolve"]("components/Sidebar/Footer", ...args);';
    const result = transform(code, transformerOpts);

    expect(result.code).toBe('require["resolve"]("./test/testproject/src/components/Sidebar/Footer", ...args);');
  });

  it('should ignore the call if the method name is unknown', () => {
    const code = 'unknown("components/Sidebar/Footer", ...args);';
    const result = transform(code, transformerOpts);

    expect(result.code).toBe('unknown("components/Sidebar/Footer", ...args);');
  });
});
