const { SlashCommandBuilder, MessageFlags } = require('discord.js');
//const fetch = require('node-fetch')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateusers')
        .setDescription('Update the guild db current user list'),

    async execute(interaction) {
        const guild = interaction.guild;

        /*
        guild.members.fetch()
        .then(members => {
            // members is a Collection of GuildMember objects
            members.forEach(member => {
                console.log(member.user.id, member.user.username, member.user.globalName);
            });
            console.log(`Total members: ${members.size}`);
        })
        .catch(console.error);
        */

        let data = {
            "guild_id": guild.id,
            "guild_name": guild.name,
            "users": []
        };

        const members = await guild.members.fetch();
        members.forEach(member => {
            data.users.push({
                id: member.user.id,
                name: member.user.username,
                global_name: member.user.globalName
            })
        });

        //console.log(data);

        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/add-users", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(data)
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch(error) {
            console.log(`Failed to update users table:\n${error}`)
            return await interaction.reply({
                content: `Failed to update users table:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result.status,
            flags: MessageFlags.Ephemeral
        });

        /*
        if (!guild) {
            return await interaction.reply("This command can only be run in a server")
        }
        console.log(`Command run in guild: ${guild.name} (id: ${guild.id})`)

        const data = {
            "guild_id": guild.id,
            "guild_name": guild.name
        }

        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/create-guild", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(data)
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch (error) {
            console.log(`Failed to create guild DB file:\n${error}`)
            return await interaction.reply({
                content: `Failed to create guild DB file:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result.msg,
            flags: MessageFlags.Ephemeral
        });
        */
    },
};
