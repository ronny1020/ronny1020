// Include node fs (file stream) and https modules
import fs from 'fs'
import axios from 'axios'

async function updateProfile() {
  const res = await axios
    .get(
      'https://api.github.com/users/ronny1020/repos?sort=updated&direction=desc'
    )
    .catch((e) => {
      console.error(e)
    })

  const lastRepos = res.data.slice(0, 3)

  let lastReposString = ''

  lastRepos.forEach((item) => {
    lastReposString += `[![ReadMe Card](https://github-readme-stats.vercel.app/api/pin/?username=ronny1020&repo=${item.name})](${item.html_url})

`
  })

  const mainProfile = fs.readFileSync('./mainProfile.md', 'utf8')

  const readme = `${mainProfile}
## Last repositories (auto updated by github action)

${lastReposString.trim()}`

  fs.writeFile('README.md', readme, 'utf-8', (err) => {
    if (err) {
      throw err
    }

    console.log('README update complete.')
  })
}

updateProfile()
