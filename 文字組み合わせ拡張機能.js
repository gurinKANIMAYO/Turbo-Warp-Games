(function(Scratch) {
  'use strict';

  class StringJoinExtension {
    getInfo() {
      return {
        id: 'stringJoiner',
        name: '文字列つなげる',
        blocks: [
          {
            opcode: 'joinStrings',
            blockType: Scratch.BlockType.REPORTER,
            text: '[STR1] と [STR2] をつなげる',
            arguments: {
              STR1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'りん'
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'ご'
              }
            }
          },
          {
            opcode: 'splitByColon',
            blockType: Scratch.BlockType.REPORTER,
            text: '[TEXT] を : で分けて [PART] を取得',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '123:456'
              },
              PART: {
                type: Scratch.ArgumentType.STRING,
                menu: 'partMenu'
              }
            }
          }
        ],
        menus: {
          partMenu: {
            acceptReporters: true,
            items: ['前', '後']
          }
        }
      };
    }

    joinStrings(args) {
      const str1 = args.STR1 || '';
      const str2 = args.STR2 || '';
      return `${str1}${str2}`;
    }

    splitByColon(args) {
      const text = args.TEXT || '';
      const part = args.PART;

      if (!text.includes(':')) return '';

      const parts = text.split(':');
      if (parts.length < 2) return '';

      return part === '前' ? parts[0] : parts[1];
    }
  }

  Scratch.extensions.register(new StringJoinExtension());
})(Scratch);
