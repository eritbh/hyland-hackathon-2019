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
		fetch('/api/gists').then(res => {
			this.loaded = true;
			return res;
		}).then(res => res.ok && res.json()).then(data => {
			this.gists = data || [];
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
		fetch('/api/me').then(res => {
			this.loaded = true;
			return res;
		}).then(res => res.ok && res.json()).then(data => {
			this.user = data || null;
		});
	},
})

Vue.component('editor-pane', {
	props: {
		file: Object,
		saveEnabled: Boolean,
	},
	data () {
		return {
			loaded: true,
			contents: '',
			codemirrorInstance: null,
			extraStyles: true,
			useCodeEditorForMarkdown: false,
		};
	},
	template: `
		<div :class="['editor-pane', {'extra-styles': extraStyles}]">
			<div class="markdown-toolbar">
				<div class="label">{{file ? file.filename : ''}}</div>
				<button
					@click="$emit('save')"
					:disabled="!saveEnabled"
				>
					Save
				</button>
			</div>
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
			fetch(newFile.raw_url).then(res => {
				this.loaded = true;
				return res;
			}).then(res => res.ok && res.text()).then(text => {
				this.updateContents(text || '');
				this.updateCMSettings();
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
			switch (this.useCodeEditorForMarkdown ? null : this.file.language) {
				case 'Markdown':
					this.codemirrorInstance.setOption('mode', 'gfm');
					this.codemirrorInstance.setOption('lineNumbers', false);
					break;
				case 'JavaScript':
					this.codemirrorInstance.setOption('mode', 'javascript');
					this.codemirrorInstance.setOption('lineNumbers', true);
					break;
				case 'Text':
				case null: // Plain text probably
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
		// TODO: load settings from localstorage
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
		saveEnabled: true,
	},
	template: `
		<div class="app">
			<user-preview/>
			<gists-sidebar
				@change="fileUpdate"
			/>
			<editor-pane
				:file="currentFile"
				:saveEnabled="saveEnabled"
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
			this.saveEnabled = false;
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
				this.saveEnabled = true;
			});
		},
	},
});

window.onbeforeunload = function () {
	if (app.contentsChanged) {
		return "You have unsaved changes, are you sure you want to leave?"
	}
};
