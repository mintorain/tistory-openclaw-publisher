#!/usr/bin/env node
const fs = require('fs');
const { config } = require('./config');
const { generateTopicPost } = require('./generate-topic');
const { publishPostFromFile } = require('./publish-post');

function parseArgs(argv) {
  const options = {
    visibility: config.blog.defaultVisibility,
    publish: true,
    headed: false,
    topic: '',
    category: '',
    tags: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--topic') options.topic = argv[++i] || '';
    else if (current === '--category') options.category = argv[++i] || '';
    else if (current === '--tags') options.tags = (argv[++i] || '').split(',').map(v => v.trim()).filter(Boolean);
    else if (current === '--visibility') options.visibility = argv[++i] || config.blog.defaultVisibility;
    else if (current === '--draft' || current === '--dry-run') options.publish = false;
    else if (current === '--headed') options.headed = true;
    else if (!current.startsWith('--') && !options.topic) options.topic = current;
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.topic) {
    throw new Error('주제가 필요합니다. 예: node src/post-topic.js --topic "오픈클로 자동화 글쓰기"');
  }

  const post = await generateTopicPost(options);
  fs.writeFileSync(config.paths.tempPost, JSON.stringify(post, null, 2), 'utf8');

  console.log('📝 temp-post.json 저장 완료');
  console.log(`- 제목: ${post.title}`);
  console.log(`- 카테고리: ${post.category}`);
  console.log(`- 태그: ${post.tags.join(', ')}`);
  console.log(`- 공개여부: ${post.visibility}`);

  if (!options.publish) {
    console.log('🟡 초안만 생성했습니다. 발행은 생략합니다.');
    return;
  }

  await publishPostFromFile(config.paths.tempPost, { headed: options.headed });
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ post-topic 실패:', error.message);
    process.exit(1);
  });
}

module.exports = { main, parseArgs };
