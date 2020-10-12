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

  console.log(lastReposString)
  console.log(mainProfile)
}

updateProfile()

// new Promise((resolve, reject) => {

// })
//   .then((resolve, reject) => {
//     const url = 'https://api.github.com/users/ronny1020/repos'
//     https.get(url, (resp) => {
//       let data = ''

//       // A chunk of data has been recieved.
//       resp.on('data', (chunk) => {
//         data += chunk
//       })

//       // The whole response has been received. Print out the result.
//       resp.on('end', () => {
//         console.log(JSON.parse(data))
//       })
//     })

//     // console.log(resolve)
//   })
//   .catch((error) => {
//     console.log(error)
//   })

// // API
//

// https.get(url, (res) => {
//   res.setEncoding('utf8')

//   res.on('data', (data) => (body += data))

//   res.on('end', () => {
//     // Parse the JSON response
//     body = JSON.parse(body)

//     // Shorten array to latest 3 articles
//     body = body.slice(0, 3)

//     // Create string of markdown to be inserted
//     const articles = `\n - [${body[0].title}](${body[0].url})\n - [${body[1].title}](${body[1].url})\n - [${body[2].title}](${body[2].url})\n \n`

//     // Update README using FS
//     fs.readFile('README.md', 'utf-8', (err, data) => {
//       if (err) {
//         throw err
//       }

//       // Replace text using regex: "I'm writing: ...replace... ![Build"
//       // Regex101.com is a lifesaver!
//       const updatedMd = data.replace(
//         /(?<=I'm writing:\n)[\s\S]*(?=\!\[Build)/gim,
//         articles
//       )

//       // Write the new README
//       fs.writeFile('README.md', updatedMd, 'utf-8', (err) => {
//         if (err) {
//           throw err
//         }

//         console.log('README update complete.')
//       })
//     })
//   })
// })
