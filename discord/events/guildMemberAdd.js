const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../provider/loggerProvider');
const User = require('../../schema/User');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(client, member) {
    try {
      if (member.user.bot) return;

      (await member.send('Check permission...')).delete();

      const result = await User.findOne({ discordId: member.id });

      if (result) {
        await member.roles.add(process.env.DISCORD_VERIFY_ROLE);

        await member.send({
          embeds: [
            new MessageEmbed()
              .setTitle('역할 복구 완료')
              .setDescription(
                `${result.grade}학년 ${result.class}반 ${result.stdId}번 으로 인증되었습니다.`,
              )
              .addField('인증 방법', '기존 유저')
              .setColor(0x7bff7b)
              .setTimestamp(new Date()),
          ],
        });

        await logger.info('기존 유저(%s)에게 인증 권한을 지급했습니다.', member.user.tag);
      }
    } catch (e) {
      if (e.message === 'Cannot send messages to this user') {
        await (
          await client.channels.fetch(process.env.DISCORD_VERIFY_CHANNEL)
        ).send({
          embeds: [
            new MessageEmbed()
              .setTitle('DM을 보낼 수 없음.')
              .setDescription(`아래 과정을 수행 후 버튼을 눌러주세요.`)
              .addField(
                'PC',
                '서버 우클릭 ➞ 개인정보 보호 설정 ➞ 서버 멤버가 보내는 다이렉트 메시지 허용하기',
              )
              .addField('모바일', '… ➞ 다이렉트 메시지 허용')
              .setColor(0xff3300)
              .setTimestamp(new Date()),
          ],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId('recheck_dm_permission')
                .setLabel('다시 시도')
                .setStyle('PRIMARY'),
            ),
          ],
        });
      } else throw e;
    }
  },
};
