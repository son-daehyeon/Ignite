const { MessageEmbed } = require('discord.js');
const User = require('../../../../schema/User');
const logger = require('../../../../provider/loggerProvider');
const sendMessage = require('../../../../util/sendMessage');

module.exports = async (client, interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('manual_verify')) {
      const name = interaction.message.embeds[0].fields[0].value;
      const grade = interaction.message.embeds[0].fields[1].value;
      const clazz = interaction.message.embeds[0].fields[2].value;
      const stdId = interaction.message.embeds[0].fields[3].value;
      const discordTag = interaction.message.embeds[0].fields[4].value;
      const discordId = interaction.message.embeds[0].fields[5].value;

      if (interaction.customId === 'manual_verify_approve') {
        await User.updateOne({ discordId }, { verify: true });

        await (
          await interaction.guild.members.fetch(discordId)
        ).roles.add(process.env.DISCORD_VERIFY_ROLE);

        await interaction.message.delete();

        await (
          await interaction.guild.members.fetch(discordId)
        ).send({
          embeds: [
            new MessageEmbed()
              .setTitle('재학생 인증 성공')
              .setDescription(`${grade}학년 ${clazz}반 ${stdId}번호 ${name} 으로 인증되었습니다.`)
              .addField('인증 방법', '수동 인증', true)
              .addField('담당자', interaction.user.tag, true)
              .setColor(0x7bff7b)
              .setTimestamp(new Date()),
          ],
        });

        await sendMessage.discord.successVerifyInDM(
          await interaction.guild.members.fetch(discordId),
          grade,
          clazz,
          stdId,
          name,
        );

        await sendMessage.discord.successVerifyInWelcomeChannel(
          interaction,
          name,
          grade,
          clazz,
          stdId,
        );

        logger.info('관리자(%s)가 유저(%s)의 인증을 승인함.', interaction.user.tag, discordTag);
      } else if (interaction.customId === 'manual_verify_reject') {
        await User.deleteOne({ discordId });

        await (
          await interaction.guild.members.fetch(discordId)
        ).send({
          embeds: [
            new MessageEmbed()
              .setTitle('재학생 인증 거부')
              .setDescription(`인증이 거부되었습니다.`)
              .addField('인증 방법', '수동 인증', true)
              .addField('담당자', interaction.user.tag, true)
              .setColor(0xff3300)
              .setTimestamp(new Date()),
          ],
        });

        await (
          await interaction.guild.members.fetch(interaction.message.embeds[0].fields[4].value)
        ).kick(`관리자(${interaction.user.tag})가 인증을 거절함.`);

        await interaction.message.delete();

        logger.warn('관리자(%s)가 유저(%s)의 인증을 거절함.', interaction.user.tag, discordTag);
      }
    }
  }
};
