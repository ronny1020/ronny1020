// Include node fs (file stream) and https modules
const fs = require('fs')
const axios = require('axios')

async function updateProfile() {
  const res = await axios
    .get(
      'https://api.github.com/users/ronny1020/repos?sort=updated&direction=desc'
    )
    .catch((e) => {
      console.error(e)
    })

  const lastRepos = res.data.slice(0, 5)

  let lastReposString = ''

  lastRepos.forEach((item) => {
    lastReposString += `[![ReadMe Card](https://github-readme-stats.vercel.app/api/pin/?username=ronny1020&repo=${item.name})](${item.html_url})

`
  })

  const mainProfile = fs.readFileSync('./mainProfile.md', 'utf8')

  const readme = `${mainProfile}
## Last repositories

${lastReposString.trim()}`

  fs.writeFile('README.md', readme, 'utf-8', (err) => {
    if (err) {
      throw err
    }

    console.log('README update complete.')
  })
}

updateProfile()
