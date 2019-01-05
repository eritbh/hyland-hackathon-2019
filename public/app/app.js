/* global Vue */
'use strict';

Vue.component('gists-sidebar', {
	props: {
		username: String,
	},
	data () {
		return {
			loaded: false,
			gists: [],
			selectedGistId: null,
			selectedFilename: null,
		};
	},
	computed: {
		selectedGist () {
			return this.gists.find(gist => gist.id === this.selectedGistId);
		},
		selectedFile () {
			if (!this.selectedGist) return null;
			return this.selectedGist.files[this.selectedFilename];
		}
	},
	methods: {
		name (gist) {
			// Return filename of the first file (TODO)
			return Object.keys(gist.files)[0];
		},
		selectGist (gistId) {
			this.selectedGistId = gistId;
			this.selectedFilename = null;
			if (gistId != null) {
				this.$emit('gist', this.selectedGist);
			}
		},
		selectFile (filename) {
			this.selectedFilename = filename;
			if (filename != null) {
				this.$emit('file', this.selectedFile);
			}
		}
	},
	template: `
		<div class="gists-sidebar">
			<div class="loading" v-if="!loaded">
				Loading...
			</div>
			<template v-else>
				<h1>
					<button v-if="selectedGist" @click="selectGist(null)">Back</button>
					{{selectedGist ? 'Files' : 'My Gists'}}
				</h1>
				<ul class="files-list" v-if="selectedGist">
					<li
						v-for="file, filename in selectedGist.files"
						:key="filename"
						class="file-item"
						@click="selectFile(filename)"
					>
						{{filename}}
					</li>
				</ul>
				<ul class="gists-list" v-else>
					<li
						v-for="gist in gists"
						:key="gist.id"
						class="gist-item"
						@click="selectGist(gist.id)"
					>
						{{name(gist)}}
					</li>
				</ul>
			</template>
		</div>
	`,
	mounted () {
		fetch('/api/gists').then(res => res.json()).then(data => {
			this.gists = data;
			this.loaded = true;
		}).catch(err => {
			this.loaded = true;
		})
	},
});

Vue.component('user-preview', {
	data () {
		return {
			loaded: false,
			user: null,
		};
	},
	template: `
		<div class="user-preview">
			<template v-if="!loaded">
				Loading...
			</template>
			<template v-else-if="user">
				<img
					:src="user.avatar_url"
					width="32"
					height="32"
				/>
				<div class="text">
					Logged in as {{user.login}}<br>
					<a href="/logout">Log Out</a>
				</div>
			</template>
			<template v-else>
				<div class="text">
					Not logged in<br>
					<a href="/auth/github">Log in with Github</a>
				</div>
			</template>
		</div>
	`,
	mounted () {
		fetch('/api/me').then(res => res.json()).then(data => {
			this.user = data;
			this.loaded = true;
		}).catch(err => {
			this.loaded = true;
		})
	},
})

Vue.component('markdown-toolbar', {
	template: `
		<div class="markdown-toolbar">
			Toolbar
		</div>
	`
})

Vue.component('editor-pane', {
	props: {
		file: Object,
	},
	data () {
		return {
			loaded: true,
			contents: '',
		};
	},
	template: `
		<div class="editor-pane">
			<div class="loading" v-if="!loaded">
				Loading...
			</div>
			<div class="no-file" v-else-if="!file">
				No file selected
			</div>
			<textarea
				class="code-area"
				v-else
				v-model="contents"
			/>
		</div>
	`,
	watch: {
		file (newFile) {
			if (!newFile) return;
			this.loaded = false;
			fetch(newFile.raw_url).then(res => res.text()).then(contents => {
				this.contents = contents;
				this.loaded = true;
			}).catch(err => {
				this.loaded = true;
			})
		}
	},
})

// Create the main Vue instance
new Vue({
	el: '#app',
	data: {
		user: null,
		loaded: false,
		currentFile: null,
	},
	template: `
		<div class="app">
			<user-preview/>
			<gists-sidebar
				@file="fileUpdate"
			/>
			<markdown-toolbar/>
			<editor-pane
				:file="currentFile"
			/>
		</div>
	`,
	methods: {
		fileUpdate (file) {
			this.currentFile = file;
		},
	},
});
