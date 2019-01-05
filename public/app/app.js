/* globals Vue, CodeMirror */
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
		},
		selectFile (filename) {
			this.selectedFilename = filename;
			if (filename != null) {
				this.$emit('change', this.selectedGist, this.selectedFile);
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
		});
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
		});
	},
})

Vue.component('markdown-toolbar', {
	template: `
		<div class="markdown-toolbar">
			Toolbar
			<button @click="$emit('save')">Save</button>
		</div>
	`
})

Vue.component('editor-pane', {
	props: {
		file: Object,
		extraStyles: Boolean,
	},
	data () {
		return {
			loaded: true,
			contents: '',
			codemirrorInstance: null,
		};
	},
	template: `
		<div :class="['editor-pane', {'extra-styles': extraStyles}]">
			<markdown-toolbar
				@save="$emit('save')"
			/>
			<div class="pane-content">
				<textarea
					class="code-area"
					id="main-textarea"
				/>
			</div>
			<!-- Overlays -->
			<div class="loading" v-if="!loaded">
				Loading...
			</div>
			<div class="no-file" v-else-if="!file">
				No file selected
			</div>
		</div>
	`,
	watch: {
		file (newFile) {
			if (!newFile) return;
			this.loaded = false;
			fetch(newFile.raw_url).then(res => res.text()).then(contents => {
				this.updateContents(contents);
				this.updateCMSettings();
				this.loaded = true;
			});
		},
	},
	methods: {
		updateContents (contents) {
			this.contents = contents;
			this.codemirrorInstance.getDoc().setValue(contents);
			this.$emit('initialValue', contents);
		},
		updateCMSettings () {
			if (!this.file) return;
			switch (this.file.language) {
				case 'Markdown':
					this.codemirrorInstance.setOption('mode', 'gfm');
					this.codemirrorInstance.setOption('lineNumbers', false);
					break;
				case "Text":
				case null: // Plain text
					this.codemirrorInstance.setOption('mode', null);
					this.codemirrorInstance.setOption('lineNumbers', false);
					break;
				default:
					this.codemirrorInstance.setOption('mode', null);
					this.codemirrorInstance.setOption('lineNumbers', true);
			}
		},
	},
	mounted () {
		this.codemirrorInstance = CodeMirror.fromTextArea(document.getElementById('main-textarea'), {
			lineNumbers: true,
		});
		this.codemirrorInstance.on('change', () => {
			this.contents = this.codemirrorInstance.getDoc().getValue();
			this.$emit('change', this.contents);
		});
	},
})

// Create the main Vue instance
const app = new Vue({
	el: '#app',
	data: {
		user: null,
		loaded: false,
		currentGist: null,
		currentFile: null,
		fileContents: null,
		contentsChanged: false,
	},
	template: `
		<div class="app">
			<user-preview/>
			<gists-sidebar
				@change="fileUpdate"
			/>
			<editor-pane
				:file="currentFile"
				extraStyles
				@change="fileContentsUpdated"
				@initialValue="fileContents = $event"
				@save="save"
			/>
		</div>
	`,
	methods: {
		fileUpdate (gist, file) {
			this.currentFile = file;
			this.currentGist = gist;
		},
		fileContentsUpdated (contents) {
			this.fileContents = contents;
			this.contentsChanged = true;
		},
		save () {
			fetch(`/api/gist/${this.currentGist.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					files: {
						[this.currentFile.filename]: {
							content: this.fileContents,
						},
					},
				}),
			}).then(res => {
				this.contentsChanged = false;
			});
		},
	},
});

window.onbeforeunload = function () {
	if (app.contentsChanged) {
		return "You have unsaved changes, are you sure you want to leave?"
	}
};
