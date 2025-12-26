const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('date')
        .setDescription('Get the timestamp of a message')
        .addStringOption(option =>
            option
                .setName('messageid')
                .setDescription('The ID of the message')
                .setRequired(true)
        ),

    async execute(interaction) {
        const messageId = interaction.options.getString('messageid');

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            console.log(message)

            const unix = Math.floor(message.createdTimestamp / 1000);

            await interaction.reply({
                content:
                    `Message **${message.id}** was sent:\n` +
                    `Raw epoch: ${message.createdTimestamp}\n` + 
                    `Message: ${message.content}`,
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Could not fetch the message. Check permissions or message ID.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
