import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api';

const About = () => {
	const [backendVersion, setBackendVersion] = useState('');
	const frontendVersion = process.env.REACT_APP_VERSION || '';
	const { t } = useTranslation();
	const api = useApi();

	useEffect(() => {
		// Fetch backend version
		const fetchBackendVersion = async () => {
			try {
				const fetchedVersion = await api.getVersion();
				console.log(fetchedVersion);
				setBackendVersion(fetchedVersion);
			} catch (error) {
				console.error('Error fetching backend version:', error);
			}
		};

		fetchBackendVersion();
	}, [api]);

	console.log(frontendVersion, backendVersion);
	return (
		<div className="sm:px-6 w-full">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl mb-2 font-bold text-primary dark:text-white">{t('common.navItemAbout')}</h1>
			</div>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
			<p className="italic text-gray-700 dark:text-gray-300">{t('pageAbout.description')}</p>

			<div className="my-2 py-2">
				<p className='dark:text-white'>{t('pageAbout.introduction')}</p>
			</div>

			<div className="my-2 py-2">
				<h1 className="text-lg mt-2 mb-2 font-bold text-primary dark:text-primary-light">{t('pageAbout.version.title')}</h1>
				<hr className="mb-2 border-t border-primary/80 dark:border-primary-light/80" />
				<p className="dark:text-white">{t('pageAbout.version.intro')}</p>
				<ul className="list-disc pl-5 dark:text-white">
					<li>{t('pageAbout.version.frontendVersion')}: {frontendVersion}</li>
					<li>{t('pageAbout.version.backendVersion')}: {backendVersion}</li>
				</ul>
			</div>
		</div>
	);
};

export default About;
