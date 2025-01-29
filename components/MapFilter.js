"use client"

import { useState } from 'react';
import Modal from "@/components/Modal";

const MapFilter = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="map-filter">
                <div className="map-filter-content">
                    <div
                        className="map-filter-content-item"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Filter
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}>
                <div className="mt-4">
                    {/* Add your filter content here */}
                    <p>Filter content goes here</p>
                </div>
            </Modal>
        </>
    );
}

export default MapFilter;