const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getmessage')
        .setDescription('Get the timestamp of a message')
        .addStringOption(option =>
            option
                .setName('messageid')
                .setDescription('The ID of the message')
                .setRequired(true)
        )
        .addChannelOption(option => 
            option
                .setName('channel')
                .setDescription("The channel id of the message")
                .setRequired(true)
        ),

    // /getmessage 1251657596104872027 1157462219295039528

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const messageId = interaction.options.getString('messageid');

        if (!channel.isTextBased()) {
            return await interaction.reply({
                content: "That channel cannot contain messages.",
                flags: MessageFlags.Ephemeral
            });
        }

        const message = await channel.messages.fetch(messageId);
        
        let output = "";

        if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
                output += `Filename: ${attachment.name}\n`;
                output += `Url: ${attachment.url}\n`
            });
            //console.log(output);
        }
        
        await interaction.reply({
            content: `${output}Message: ${message.content || "No Text"}`,
            flags: MessageFlags.Ephemeral
        })
    },
};
